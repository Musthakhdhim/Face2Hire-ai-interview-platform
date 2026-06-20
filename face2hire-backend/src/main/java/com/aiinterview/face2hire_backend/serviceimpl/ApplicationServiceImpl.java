package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.entity.*;
import com.aiinterview.face2hire_backend.exception.ResourceNotFoundException;
import com.aiinterview.face2hire_backend.exception.ValidationException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.*;
import com.aiinterview.face2hire_backend.repository.interview.ScheduledInterviewRepository;
import com.aiinterview.face2hire_backend.service.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final JobSkillRepository jobSkillRepository;
    private final ResumeRepository resumeRepository;
    private final ExperienceRepository experienceRepository;
    private final SkillRepository skillRepository;
    private final ScheduledInterviewRepository scheduledInterviewRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final BadgeService badgeService;
    private final StageWorkflowService stageWorkflowService;
    private final ObjectMapper objectMapper;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @jakarta.annotation.PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Override
    @Transactional
    public ApplicationResponseDto applyForJob(Long userId, ApplicationRequestDto request) {
        log.info("User {} applying for job {}", userId, request.getJobId());

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (job.getStatus() != JobStatus.ACTIVE) {
            throw new ValidationException("This job is no longer accepting applications");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        validateEligibility(user, job);

        if (applicationRepository.existsByJobIdAndUserId(request.getJobId(), userId)) {
            throw new ValidationException("You have already applied for this job");
        }

        boolean isMultiRound = job.getHasMultiRound() != null && job.getHasMultiRound();

        if (job.getHasMultiRound() == null) {
            isMultiRound = true;
            log.info("Job hasMultiRound is null, defaulting to true for job {}", job.getId());
        }

        Application application = Application.builder()
                .jobId(request.getJobId())
                .userId(userId)
                .coverLetter(request.getCoverLetter())
                .status(ApplicationStatus.PENDING)
                .score(0.0)
                .isMultiRound(isMultiRound)
                .currentStageOrder(1)
                .overallResult(OverallResult.PENDING)
                .build();

        application = applicationRepository.save(application);
        log.info("Application created with id: {}, isMultiRound: {}", application.getId(), application.getIsMultiRound());

        if (isMultiRound) {
            WorkflowConfigDto config = parseWorkflowConfig(job.getWorkflowConfig());
            if (config == null) {
                log.info("No workflow config found for job {}, using default", job.getId());
                config = stageWorkflowService.getDefaultWorkflowConfig();
            }
            stageWorkflowService.initializeStagesForApplication(application, config);
            log.info("Initialized {} stages for application {}", config.getStages().size(), application.getId());
        } else {
            initializeDefaultStageForApplication(application);
        }

        if (job.getPostedByUserId() != null) {
            notificationService.createNotification(
                    job.getPostedByUserId(),
                    "New Job Application",
                    user.getFullName() + " applied for your job: " + job.getTitle(),
                    "JOB_APPLIED"
            );
        }

        activityLogService.log(user, ActivityAction.JOB_APPLIED,
                String.format("Applied for job: %s (ID: %d)", job.getTitle(), job.getId()));

        job.setApplicantsCount(job.getApplicantsCount() + 1);
        jobRepository.save(job);

        log.info("Application created with id: {}", application.getId());
        return mapToResponseDto(application);
    }


    private void initializeDefaultStageForApplication(Application application) {
        List<ApplicationStageDto> existingStagesDto = stageWorkflowService.getApplicationStages(application.getId());
        if (existingStagesDto != null && !existingStagesDto.isEmpty()) {
            log.info("Stages already exist for application {}", application.getId());
            return;
        }

        ApplicationStage stage = ApplicationStage.builder()
                .applicationId(application.getId())
                .stageOrder(1)
                .stageType(StageType.TECHNICAL)
                .status(StageStatus.PENDING)
                .minimumScore(70.0)
                .build();

        stage = stageWorkflowService.saveStage(stage);
        log.info("Default stage created for application {}", application.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ApplicationListResponseDto> getMyApplications(Long userId, Pageable pageable) {
        return applicationRepository.findByUserId(userId, pageable)
                .map(this::mapToListDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ApplicationListResponseDto> getApplicationsForJob(Long jobId, Pageable pageable) {
        jobRepository.findById(jobId).orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        return applicationRepository.findByJobId(jobId, pageable)
                .map(this::mapToListDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ApplicationListResponseDto> getApplicationsForInterviewer(Long interviewerId, Pageable pageable) {
        return applicationRepository.findByInterviewerId(interviewerId, pageable)
                .map(this::mapToListDto);
    }

    @Override
    @Transactional
    public ApplicationResponseDto updateApplicationStatus(Long applicationId, Long interviewerId, ApplicationStatusUpdateDto dto) throws AccessDeniedException {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        Job job = jobRepository.findById(application.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!job.getPostedByUserId().equals(interviewerId)) {
            throw new AccessDeniedException("You are not authorized to update this application");
        }

        if (application.getIsMultiRound() != null && application.getIsMultiRound()) {
            ApplicationStage currentStage = stageWorkflowService.getCurrentStageEntity(applicationId);
            if (currentStage == null) {
                throw new ValidationException("No active stage found for this application");
            }

            if (dto.getStatus() == ApplicationStatus.APPROVED) {
                stageWorkflowService.approveStage(applicationId, currentStage.getId(),
                        application.getScore() != null ? application.getScore() : 70.0,
                        "Application approved by interviewer");
            } else if (dto.getStatus() == ApplicationStatus.REJECTED) {
                stageWorkflowService.rejectStage(applicationId, currentStage.getId(),
                        "Application rejected by interviewer");
            }
        }

        application.setStatus(dto.getStatus());
        application = applicationRepository.save(application);
        log.info("Application {} status updated to {}", applicationId, dto.getStatus());

        notificationService.createNotification(
                application.getUserId(),
                "Application " + dto.getStatus(),
                "Your application for job ID " + application.getJobId() + " has been " + dto.getStatus(),
                dto.getStatus() == ApplicationStatus.APPROVED ? "APPLICATION_APPROVED" : "APPLICATION_REJECTED"
        );

        User applicant = userRepository.findById(application.getUserId()).orElse(null);
        if (applicant != null) {
            ActivityAction action = dto.getStatus() == ApplicationStatus.APPROVED ?
                    ActivityAction.APPLICATION_APPROVED : ActivityAction.APPLICATION_REJECTED;
            String msg = String.format("Application for job ID %d %s", application.getJobId(), dto.getStatus());
            activityLogService.log(applicant, action, msg);
        }

        if (dto.getStatus() == ApplicationStatus.APPROVED) {
            try {
                badgeService.checkAndAwardBadges(interviewerId);
            } catch (Exception e) {
                log.warn("Failed to check badges for interviewer {}: {}", interviewerId, e.getMessage());
            }
        }

        return mapToResponseDto(application);
    }

    @Override
    @Transactional(readOnly = true)
    public ApplicationResponseDto getApplicationById(Long applicationId, Long currentUserId) throws AccessDeniedException {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        Job job = jobRepository.findById(application.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!application.getUserId().equals(currentUserId) && !job.getPostedByUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You are not authorized to view this application");
        }

        ensureStagesInitialized(application);

        return mapToResponseDto(application);
    }

    private void ensureStagesInitialized(Application application) {
        List<ApplicationStageDto> existingStagesDto = stageWorkflowService.getApplicationStages(application.getId());
        if (existingStagesDto == null || existingStagesDto.isEmpty()) {
            log.info("No stages found for application {}, initializing...", application.getId());

            if (application.getIsMultiRound() != null && application.getIsMultiRound()) {
                Job job = jobRepository.findById(application.getJobId()).orElse(null);
                if (job != null) {
                    WorkflowConfigDto config = parseWorkflowConfig(job.getWorkflowConfig());
                    if (config == null) {
                        config = stageWorkflowService.getDefaultWorkflowConfig();
                    }
                    stageWorkflowService.initializeStagesForApplication(application, config);
                    log.info("Stages initialized for application {}", application.getId());
                }
            } else {
                Job job = jobRepository.findById(application.getJobId()).orElse(null);
                if (job != null) {
                    WorkflowConfigDto config = parseWorkflowConfig(job.getWorkflowConfig());
                    if (config != null) {
                        stageWorkflowService.initializeStagesForApplication(application, config);
                        log.info("Stages initialized from job config for application {}", application.getId());
                        return;
                    }
                }
                initializeDefaultStageForApplication(application);
            }
        }
    }


    @Transactional(readOnly = true)
    public ApplicationWithStagesDto getApplicationWithStages(Long applicationId, Long currentUserId) throws AccessDeniedException {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        Job job = jobRepository.findById(application.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!application.getUserId().equals(currentUserId) && !job.getPostedByUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You are not authorized to view this application");
        }

        ensureStagesInitialized(application);

        ApplicationResponseDto appDto = mapToResponseDto(application);
        List<ApplicationStageDto> stages = stageWorkflowService.getApplicationStages(applicationId);
        ApplicationStageDto currentStage = stageWorkflowService.getCurrentStage(applicationId);

        return ApplicationWithStagesDto.builder()
                .application(appDto)
                .stages(stages)
                .currentStage(currentStage)
                .build();
    }

    private void validateEligibility(User user, Job job) {
        Resume activeResume = resumeRepository.findByUserIdAndIsActiveTrue(user.getId());
        if (activeResume == null || activeResume.getStatus() != ResumeStatus.COMPLETED) {
            throw new ValidationException("You must upload and have your CV processed before applying");
        }

        Integer requiredExp = job.getRequiredExperience();
        if (requiredExp != null && requiredExp > 0) {
            int userExp = calculateExperienceFromResume(user);
            if (userExp < requiredExp) {
                throw new ValidationException("Your experience (" + userExp + " years) does not meet the job requirement (" + requiredExp + " years)");
            }
        }

        List<String> requiredSkills = jobSkillRepository.findByJobId(job.getId())
                .stream()
                .map(JobSkill::getSkillName)
                .collect(Collectors.toList());
        if (!requiredSkills.isEmpty()) {
            List<String> userSkills = extractSkillsFromResume(user);
            boolean hasAll = requiredSkills.stream().allMatch(requiredSkill ->
                    userSkills.stream().anyMatch(userSkill ->
                            normalizeSkillName(userSkill).equalsIgnoreCase(normalizeSkillName(requiredSkill))
                    )
            );
            if (!hasAll) {
                throw new ValidationException("You do not possess all the required skills for this job");
            }
        }
    }

    private String normalizeSkillName(String skill) {
        return skill == null ? "" : skill.trim().replaceAll("\\s+", " ");
    }

    private int calculateExperienceFromResume(User user) {
        Resume activeResume = resumeRepository.findByUserIdAndIsActiveTrue(user.getId());
        if (activeResume == null) return 0;
        List<Experience> experiences = experienceRepository.findByResumeId(activeResume.getId());
        if (experiences == null || experiences.isEmpty()) return 0;

        long totalMonths = 0;
        for (Experience exp : experiences) {
            if (exp.getStartDate() != null) {
                LocalDate end = exp.getEndDate() != null ? exp.getEndDate() : LocalDate.now();
                totalMonths += ChronoUnit.MONTHS.between(exp.getStartDate(), end);
            }
        }
        return (int) (totalMonths / 12);
    }

    private List<String> extractSkillsFromResume(User user) {
        Resume activeResume = resumeRepository.findByUserIdAndIsActiveTrue(user.getId());
        if (activeResume == null) return List.of();
        List<Skill> skills = skillRepository.findByResumeId(activeResume.getId());
        if (skills == null || skills.isEmpty()) return List.of();
        return skills.stream()
                .map(Skill::getSkillName)
                .collect(Collectors.toList());
    }

    private WorkflowConfigDto parseWorkflowConfig(String configJson) {
        try {
            if (configJson != null && !configJson.isEmpty()) {
                return objectMapper.readValue(configJson, WorkflowConfigDto.class);
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse workflow config", e);
        }
        return null;
    }

    private ApplicationResponseDto mapToResponseDto(Application application) {
        Job job = jobRepository.findById(application.getJobId()).orElse(null);
        User user = userRepository.findById(application.getUserId()).orElse(null);

        String currentStageName = null;
        Integer totalStages = null;
        if (application.getIsMultiRound() != null && application.getIsMultiRound()) {
            try {
                ApplicationStageDto currentStage = stageWorkflowService.getCurrentStage(application.getId());
                if (currentStage != null) {
                    currentStageName = currentStage.getStageType().name();
                }
                List<ApplicationStageDto> stages = stageWorkflowService.getApplicationStages(application.getId());
                totalStages = stages.size();
            } catch (Exception e) {
                log.warn("Failed to fetch stage info for application {}", application.getId());
            }
        }

        return ApplicationResponseDto.builder()
                .id(application.getId())
                .jobId(application.getJobId())
                .jobTitle(job != null ? job.getTitle() : null)
                .company(job != null ? job.getCompany() : null)
                .userId(application.getUserId())
                .userName(user != null ? user.getUserName() : null)
                .userEmail(user != null ? user.getEmail() : null)
                .coverLetter(application.getCoverLetter())
                .status(application.getStatus())
                .score(application.getScore())
                .appliedAt(application.getAppliedAt())
                .updatedAt(application.getUpdatedAt())
                .isMultiRound(application.getIsMultiRound())
                .currentStageOrder(application.getCurrentStageOrder())
                .currentStageName(currentStageName)
                .totalStages(totalStages)
                .overallResult(application.getOverallResult() != null ? application.getOverallResult().name() : null)
                .build();
    }

    private ApplicationListResponseDto mapToListDto(Application application) {
        Job job = jobRepository.findById(application.getJobId()).orElse(null);
        User user = userRepository.findById(application.getUserId()).orElse(null);
        boolean hasScheduled = scheduledInterviewRepository.existsByApplicationId(application.getId());

        String currentStageName = null;
        if (application.getIsMultiRound() != null && application.getIsMultiRound()) {
            try {
                ApplicationStageDto currentStage = stageWorkflowService.getCurrentStage(application.getId());
                if (currentStage != null) {
                    currentStageName = currentStage.getStageType().name();
                }
            } catch (Exception e) {
            }
        }

        return ApplicationListResponseDto.builder()
                .id(application.getId())
                .jobId(application.getJobId())
                .jobTitle(job != null ? job.getTitle() : null)
                .userId(application.getUserId())
                .userName(user != null ? user.getUserName() : null)
                .userEmail(user != null ? user.getEmail() : null)
                .score(application.getScore())
                .status(application.getStatus())
                .appliedAt(application.getAppliedAt())
                .hasScheduledInterview(hasScheduled)
                .isMultiRound(application.getIsMultiRound())
                .currentStageName(currentStageName)
                .build();
    }
}