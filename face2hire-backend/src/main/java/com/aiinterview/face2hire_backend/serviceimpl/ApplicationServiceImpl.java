package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.entity.*;
import com.aiinterview.face2hire_backend.exception.ResourceNotFoundException;
import com.aiinterview.face2hire_backend.exception.ValidationException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.*;
import com.aiinterview.face2hire_backend.repository.interview.ScheduledInterviewRepository;
import com.aiinterview.face2hire_backend.service.ActivityLogService;
import com.aiinterview.face2hire_backend.service.ApplicationService;
import com.aiinterview.face2hire_backend.service.BadgeService;
import com.aiinterview.face2hire_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
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

        Application application = Application.builder()
                .jobId(request.getJobId())
                .userId(userId)
                .coverLetter(request.getCoverLetter())
                .status(ApplicationStatus.PENDING)
                .score(0.0)
                .build();

        application = applicationRepository.save(application);

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

        application.setStatus(dto.getStatus());
        application = applicationRepository.save(application);
        log.info("Application {} status updated to {}", applicationId, dto.getStatus());

        notificationService.createNotification(
                application.getUserId(),
                "Application " + dto.getStatus(),
                "Your application for job ID " + application.getJobId() + " has been " + dto.getStatus(),
                dto.getStatus().equals("APPROVED") ? "APPLICATION_APPROVED" : "APPLICATION_REJECTED"
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

    private double calculateAverageInterviewScore(User user) {
        return 0.0;
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

        return mapToResponseDto(application);
    }

    private ApplicationResponseDto mapToResponseDto(Application application) {
        Job job = jobRepository.findById(application.getJobId()).orElse(null);
        User user = userRepository.findById(application.getUserId()).orElse(null);
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
                .build();
    }

    private ApplicationListResponseDto mapToListDto(Application application) {
        Job job = jobRepository.findById(application.getJobId()).orElse(null);
        User user = userRepository.findById(application.getUserId()).orElse(null);
        boolean hasScheduled = scheduledInterviewRepository.existsByApplicationId(application.getId());
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
                .build();
    }


}