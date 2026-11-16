package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.ApplicationStageDto;
import com.aiinterview.face2hire_backend.dto.StageConfigDto;
import com.aiinterview.face2hire_backend.dto.StageDecisionRequest;
import com.aiinterview.face2hire_backend.dto.WorkflowConfigDto;
import com.aiinterview.face2hire_backend.entity.Application;
import com.aiinterview.face2hire_backend.entity.ApplicationStage;
import com.aiinterview.face2hire_backend.entity.ApplicationStatus;
import com.aiinterview.face2hire_backend.entity.Job;
import com.aiinterview.face2hire_backend.entity.OverallResult;
import com.aiinterview.face2hire_backend.entity.StageStatus;
import com.aiinterview.face2hire_backend.entity.StageType;
import com.aiinterview.face2hire_backend.entity.interview.InterviewFeedback;
import com.aiinterview.face2hire_backend.entity.interview.InterviewMode;
import com.aiinterview.face2hire_backend.entity.interview.InterviewSession;
import com.aiinterview.face2hire_backend.entity.interview.ScheduledInterview;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import com.aiinterview.face2hire_backend.exception.ResourceNotFoundException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.ApplicationRepository;
import com.aiinterview.face2hire_backend.repository.ApplicationStageRepository;
import com.aiinterview.face2hire_backend.repository.JobRepository;
import com.aiinterview.face2hire_backend.repository.interview.InterviewFeedbackRepository;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.repository.interview.ScheduledInterviewRepository;
import com.aiinterview.face2hire_backend.service.ActivityLogService;
import com.aiinterview.face2hire_backend.service.NotificationService;
import com.aiinterview.face2hire_backend.service.RealtimeEventService;
import com.aiinterview.face2hire_backend.service.StageWorkflowService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StageWorkflowServiceImpl implements StageWorkflowService {

    private final ApplicationStageRepository stageRepository;
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final ScheduledInterviewRepository scheduledInterviewRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewFeedbackRepository interviewFeedbackRepository;
    private final NotificationService notificationService;
    private final RealtimeEventService realtimeEventService;
    private final ActivityLogService activityLogService;
    private final ObjectMapper objectMapper;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Override
    public WorkflowConfigDto getDefaultWorkflowConfig() {
        List<StageConfigDto> stages = new ArrayList<>();
        stages.add(StageConfigDto.builder()
                .stageType(StageType.TECHNICAL)
                .interviewMode(InterviewMode.AI)
                .order(1)
                .minimumScore(70.0)
                .duration(45)
                .questionCount(10)
                .required(true)
                .description("Technical skills assessment")
                .build());
        stages.add(StageConfigDto.builder()
                .stageType(StageType.HR)
                .interviewMode(InterviewMode.AI)
                .order(2)
                .minimumScore(65.0)
                .duration(30)
                .questionCount(8)
                .required(true)
                .description("Cultural fit and soft skills")
                .build());
        stages.add(StageConfigDto.builder()
                .stageType(StageType.BEHAVIORAL)
                .interviewMode(InterviewMode.AI)
                .order(3)
                .minimumScore(70.0)
                .duration(30)
                .questionCount(8)
                .required(true)
                .description("Behavioral and situational assessment")
                .build());
        stages.add(StageConfigDto.builder()
                .stageType(StageType.SALARY)
                .interviewMode(InterviewMode.AI)
                .order(4)
                .minimumScore(60.0)
                .duration(20)
                .questionCount(5)
                .required(false)
                .description("Salary and compensation discussion")
                .build());

        return WorkflowConfigDto.builder()
                .stages(stages)
                .enabled(true)
                .build();
    }

    @Override
    @Transactional
    public List<ApplicationStageDto> getApplicationStages(Long applicationId) {
        List<ApplicationStage> stages = stageRepository.findByApplicationIdOrderByStageOrderAsc(applicationId);
        return stages.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ApplicationStageDto getCurrentStage(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (application.getCurrentStageOrder() == null) {
            application.setCurrentStageOrder(1);
            applicationRepository.save(application);
        }

        List<ApplicationStage> allStages = stageRepository.findByApplicationIdOrderByStageOrderAsc(applicationId);
        for (ApplicationStage stage : allStages) {
            if (stage.getStatus() == StageStatus.PENDING || stage.getStatus() == StageStatus.IN_PROGRESS) {
                // Update the application's currentStageOrder to this stage
                if (!application.getCurrentStageOrder().equals(stage.getStageOrder())) {
                    application.setCurrentStageOrder(stage.getStageOrder());
                    applicationRepository.save(application);
                }
                return toDto(stage);
            }
        }

        if (!allStages.isEmpty()) {
            ApplicationStage lastStage = allStages.get(allStages.size() - 1);
            return toDto(lastStage);
        }

        throw new ResourceNotFoundException("Current stage not found");
    }

    @Override
    @Transactional
    public ApplicationStageDto startStage(Long applicationId, Long stageId, Long scheduledInterviewId) {
        ApplicationStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));

        if (!stage.getApplicationId().equals(applicationId)) {
            throw new RuntimeException("Stage does not belong to this application");
        }

        stage.setStatus(StageStatus.IN_PROGRESS);
        stage.setScheduledInterviewId(scheduledInterviewId);
        stage.setStartedAt(LocalDateTime.now());
        stageRepository.save(stage);

        Application application = applicationRepository.findById(applicationId).orElseThrow();
        application.setCurrentStageOrder(stage.getStageOrder());
        applicationRepository.save(application);

        log.info("Stage {} started for application {}", stage.getStageType(), applicationId);
        ApplicationStageDto dto = toDto(stage);
        realtimeEventService.publishApplicationEvent(
                "STAGE_STARTED", applicationId, application.getUserId(), null, dto);
        return dto;
    }

    @Override
    @Transactional
    public ApplicationStageDto approveStage(Long applicationId, Long stageId, Double score, String feedback) {
        StageDecisionRequest decision = StageDecisionRequest.builder()
                .stageId(stageId)
                .approved(true)
                .score(score)
                .feedback(feedback)
                .build();
        return approveStage(applicationId, stageId, score, decision);
    }

    @Override
    @Transactional
    public ApplicationStageDto approveStage(
            Long applicationId, Long stageId, Double score, StageDecisionRequest decision) {
        ApplicationStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));

        if (!stage.getApplicationId().equals(applicationId)) {
            throw new RuntimeException("Stage does not belong to this application");
        }

        String feedback = decision != null ? decision.getFeedback() : null;
        Double finalScore = score != null ? score : (decision != null ? decision.getScore() : 70.0);

        stage.setStatus(StageStatus.APPROVED);
        stage.setActualScore(finalScore);
        stage.setFeedback(feedback);
        stage.setCompletedAt(LocalDateTime.now());
        stageRepository.save(stage);

        if (stage.getScheduledInterviewId() != null) {
            scheduledInterviewRepository.findById(stage.getScheduledInterviewId()).ifPresent(scheduled -> {
                scheduled.setCallEnded(true);
                scheduled.setLiveCompleted(true);
                scheduledInterviewRepository.save(scheduled);
                saveLiveEvaluationSessionAndFeedback(scheduled, finalScore, decision);
            });
        }

        Application application = applicationRepository.findById(applicationId).orElseThrow();
        if (finalScore != null) {
            application.setScore(finalScore);
        }

        String jobTitle = getJobTitle(application.getJobId());

        List<ApplicationStage> allStages = stageRepository.findByApplicationIdOrderByStageOrderAsc(applicationId);
        boolean allCompleted = allStages.stream()
                .allMatch(s -> s.getStatus() == StageStatus.APPROVED || s.getStatus() == StageStatus.SKIPPED);

        if (allCompleted) {
            application.setOverallResult(OverallResult.PASSED);
            application.setCurrentStageOrder(allStages.size());
            applicationRepository.save(application);

            notificationService.createNotification(
                    application.getUserId(),
                    "Application Approved!",
                    "Congratulations! You've passed all interview rounds for " + jobTitle,
                    "APPLICATION_APPROVED"
            );
        } else {
            ApplicationStage nextStage = null;
            for (ApplicationStage s : allStages) {
                if (s.getStageOrder() > stage.getStageOrder() && s.getStatus() == StageStatus.PENDING) {
                    nextStage = s;
                    break;
                }
            }

            if (nextStage != null) {
                nextStage.setStatus(StageStatus.PENDING);
                stageRepository.save(nextStage);

                application.setCurrentStageOrder(nextStage.getStageOrder());
                applicationRepository.save(application);

                notificationService.createNotification(
                        application.getUserId(),
                        "You've Advanced!",
                        "You've passed the " + stage.getStageType() + " round! Next up: " + nextStage.getStageType(),
                        "STAGE_APPROVED"
                );
            } else {
                boolean allDone = allStages.stream()
                        .allMatch(s -> s.getStatus() == StageStatus.APPROVED || s.getStatus() == StageStatus.SKIPPED);
                if (allDone) {
                    application.setOverallResult(OverallResult.PASSED);
                    application.setCurrentStageOrder(allStages.size());
                    applicationRepository.save(application);

                    notificationService.createNotification(
                            application.getUserId(),
                            "Application Approved!",
                            "Congratulations! You've passed all interview rounds for " + jobTitle,
                            "APPLICATION_APPROVED"
                    );
                }
            }
        }

        log.info("Stage {} approved for application {}", stage.getStageType(), applicationId);
        ApplicationStageDto dto = toDto(stage);
        realtimeEventService.publishApplicationEvent(
                "STAGE_APPROVED", applicationId, application.getUserId(), null, dto);
        if (stage.getScheduledInterviewId() != null) {
            realtimeEventService.publishInterviewEvent(
                    "INTERVIEW_EVALUATED",
                    stage.getScheduledInterviewId(),
                    application.getUserId(),
                    applicationId,
                    dto
            );
        }
        return dto;
    }

    @Override
    @Transactional
    public ApplicationStageDto rejectStage(Long applicationId, Long stageId, String feedback) {
        StageDecisionRequest decision = StageDecisionRequest.builder()
                .stageId(stageId)
                .approved(false)
                .feedback(feedback)
                .build();
        return rejectStage(applicationId, stageId, decision);
    }

    @Override
    @Transactional
    public ApplicationStageDto rejectStage(Long applicationId, Long stageId, StageDecisionRequest decision) {
        ApplicationStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));

        if (!stage.getApplicationId().equals(applicationId)) {
            throw new RuntimeException("Stage does not belong to this application");
        }

        String feedback = decision != null && decision.getFeedback() != null
                ? decision.getFeedback()
                : "Failed to meet requirements";
        Double finalScore = decision != null && decision.getScore() != null ? decision.getScore() : 40.0;

        stage.setStatus(StageStatus.REJECTED);
        stage.setActualScore(finalScore);
        stage.setFeedback(feedback);
        stage.setCompletedAt(LocalDateTime.now());
        stageRepository.save(stage);

        if (stage.getScheduledInterviewId() != null) {
            scheduledInterviewRepository.findById(stage.getScheduledInterviewId()).ifPresent(scheduled -> {
                scheduled.setCallEnded(true);
                scheduled.setLiveCompleted(true);
                scheduledInterviewRepository.save(scheduled);
                saveLiveEvaluationSessionAndFeedback(scheduled, finalScore, decision);
            });
        }

        Application application = applicationRepository.findById(applicationId).orElseThrow();
        if (finalScore != null) {
            application.setScore(finalScore);
        }
        application.setOverallResult(OverallResult.FAILED);
        application.setStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(application);

        String jobTitle = getJobTitle(application.getJobId());

        notificationService.createNotification(
                application.getUserId(),
                "Application Update",
                "Your application for " + jobTitle + " was not successful in the " + stage.getStageType() + " round.",
                "APPLICATION_REJECTED"
        );

        log.info("Stage {} rejected for application {}", stage.getStageType(), applicationId);
        ApplicationStageDto dto = toDto(stage);
        realtimeEventService.publishApplicationEvent(
                "STAGE_REJECTED", applicationId, application.getUserId(), null, dto);
        if (stage.getScheduledInterviewId() != null) {
            realtimeEventService.publishInterviewEvent(
                    "INTERVIEW_EVALUATED",
                    stage.getScheduledInterviewId(),
                    application.getUserId(),
                    applicationId,
                    dto
            );
        }
        return dto;
    }

    private void saveLiveEvaluationSessionAndFeedback(
            ScheduledInterview scheduled, Double overallScore, StageDecisionRequest decision) {
        double safeOverall = overallScore != null ? overallScore : 70.0;
        double commScore = decision != null && decision.getCommunicationScore() != null
                ? decision.getCommunicationScore()
                : safeOverall;
        double techScore = decision != null && decision.getTechnicalScore() != null
                ? decision.getTechnicalScore()
                : safeOverall;
        double confScore = decision != null && decision.getConfidenceScore() != null
                ? decision.getConfidenceScore()
                : safeOverall;

        InterviewSession session = interviewSessionRepository.findByScheduledInterviewId(scheduled.getId())
                .orElseGet(() -> InterviewSession.builder()
                        .userId(scheduled.getIntervieweeId())
                        .type(scheduled.getType())
                        .difficulty(scheduled.getDifficulty())
                        .duration(scheduled.getDuration())
                        .questionCount(0)
                        .avatarStyle(scheduled.getAvatarStyle())
                        .isScheduled(true)
                        .scheduledInterviewId(scheduled.getId())
                        .startedAt(scheduled.getScheduledAt() != null
                                ? scheduled.getScheduledAt()
                                : LocalDateTime.now())
                        .originalQuestionCount(0)
                        .originalDurationMinutes(scheduled.getDuration() != null ? scheduled.getDuration() : 30)
                        .build());

        session.setStatus(SessionStatus.COMPLETED);
        session.setOverallScore(safeOverall);
        session.setCommunicationScore(commScore);
        session.setTechnicalScore(techScore);
        session.setConfidenceScore(confScore);
        session.setCompletedAt(LocalDateTime.now());
        session = interviewSessionRepository.save(session);

        final Long sessionId = session.getId();
        InterviewFeedback fb = interviewFeedbackRepository.findBySessionId(sessionId)
                .orElseGet(() -> InterviewFeedback.builder()
                        .sessionId(sessionId)
                        .suggestedResources("[]")
                        .build());

        fb.setOverallScore(safeOverall);
        fb.setStrengths(decision != null && decision.getStrengths() != null
                ? decision.getStrengths()
                : "Demonstrated solid engagement during the live interview.");
        fb.setImprovements(decision != null && decision.getImprovements() != null
                ? decision.getImprovements()
                : "Continue refining domain depth and structured examples.");
        fb.setDetailedFeedback(decision != null && decision.getFeedback() != null
                ? decision.getFeedback()
                : "Evaluated by interviewer following the live video session.");
        if (fb.getSuggestedResources() == null) {
            fb.setSuggestedResources("[]");
        }
        interviewFeedbackRepository.save(fb);
    }

    @Override
    @Transactional
    public ApplicationStageDto skipStage(Long applicationId, Long stageId, String reason) {
        ApplicationStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));

        if (!stage.getApplicationId().equals(applicationId)) {
            throw new RuntimeException("Stage does not belong to this application");
        }

        stage.setStatus(StageStatus.SKIPPED);
        stage.setFeedback("Skipped: " + (reason != null ? reason : "No reason provided"));
        stage.setCompletedAt(LocalDateTime.now());
        stageRepository.save(stage);

        Application application = applicationRepository.findById(applicationId).orElseThrow();

        ApplicationStage nextStage = getNextStageEntity(applicationId);
        if (nextStage != null) {
            application.setCurrentStageOrder(nextStage.getStageOrder());
        } else {
            application.setOverallResult(OverallResult.PASSED);
        }
        applicationRepository.save(application);

        log.info("Stage {} skipped for application {}", stage.getStageType(), applicationId);
        return toDto(stage);
    }

    @Override
    public ApplicationStageDto getStageById(Long stageId) {
        ApplicationStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));
        return toDto(stage);
    }

    @Override
    public boolean isAllStagesCompleted(Long applicationId) {
        List<ApplicationStage> stages = stageRepository.findByApplicationIdOrderByStageOrderAsc(applicationId);
        return stages.stream().allMatch(s ->
                s.getStatus() == StageStatus.APPROVED || s.getStatus() == StageStatus.SKIPPED
        );
    }

    @Override
    public boolean hasReachedFinalStage(Long applicationId) {
        List<ApplicationStage> stages = stageRepository.findByApplicationIdOrderByStageOrderAsc(applicationId);
        Application application = applicationRepository.findById(applicationId).orElseThrow();
        return application.getCurrentStageOrder() != null &&
                application.getCurrentStageOrder() >= stages.size();
    }

    @Override
    public ApplicationStageDto getNextStage(Long applicationId) {
        ApplicationStage next = getNextStageEntity(applicationId);
        return next != null ? toDto(next) : null;
    }

    @Override
    public List<StageType> getCompletedStages(Long applicationId) {
        List<ApplicationStage> stages = stageRepository.findByApplicationIdAndStatus(applicationId, StageStatus.APPROVED);
        return stages.stream().map(ApplicationStage::getStageType).collect(Collectors.toList());
    }

    @Override
    public ApplicationStage getCurrentStageEntity(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        Integer currentOrder = application.getCurrentStageOrder();
        if (currentOrder == null) {
            currentOrder = 1;
            application.setCurrentStageOrder(currentOrder);
            applicationRepository.save(application);
        }

        return stageRepository.findByApplicationIdAndStageOrder(applicationId, currentOrder)
                .orElse(null);
    }

    @Override
    @Transactional
    public void initializeStagesForApplication(Application application, WorkflowConfigDto config) {
        if (config == null) {
            config = getDefaultWorkflowConfig();
        }

        List<ApplicationStage> existingStages = stageRepository.findByApplicationIdOrderByStageOrderAsc(application.getId());
        if (!existingStages.isEmpty()) {
            stageRepository.deleteAll(existingStages);
        }

        List<ApplicationStage> stages = new ArrayList<>();
        for (StageConfigDto stageConfig : config.getStages()) {
            InterviewMode mode = stageConfig.getInterviewMode() != null
                    ? stageConfig.getInterviewMode()
                    : InterviewMode.AI;
            ApplicationStage stage = ApplicationStage.builder()
                    .applicationId(application.getId())
                    .stageOrder(stageConfig.getOrder())
                    .stageType(stageConfig.getStageType())
                    .interviewMode(mode)
                    .status(StageStatus.PENDING)
                    .minimumScore(stageConfig.getMinimumScore())
                    .build();
            stages.add(stage);
            log.info("Created stage: {} with order: {} and mode: {}",
                    stageConfig.getStageType(), stageConfig.getOrder(), mode);
        }

        stageRepository.saveAll(stages);
        log.info("Saved {} stages for application {}", stages.size(), application.getId());

        try {
            String configJson = objectMapper.writeValueAsString(config);
            application.setWorkflowConfig(configJson);
            application.setIsMultiRound(true);
            application.setCurrentStageOrder(1);
            application.setOverallResult(OverallResult.PENDING);
            applicationRepository.save(application);
            log.info("Application {} updated with workflow config", application.getId());
        } catch (JsonProcessingException e) {
            log.error("Failed to save workflow config", e);
        }

        log.info("Initialized {} stages for application {}", stages.size(), application.getId());
    }

    @Override
    @Transactional
    public ApplicationStage saveStage(ApplicationStage stage) {
        return stageRepository.save(stage);
    }

    private String getJobTitle(Long jobId) {
        try {
            return jobRepository.findById(jobId)
                    .map(Job::getTitle)
                    .orElse("Job");
        } catch (Exception e) {
            log.warn("Failed to fetch job title for jobId: {}", jobId);
            return "Job";
        }
    }

    private ApplicationStage getNextStageEntity(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElseThrow();
        Integer currentOrder = application.getCurrentStageOrder() != null ?
                application.getCurrentStageOrder() : 0;

        List<ApplicationStage> stages = stageRepository.findByApplicationIdOrderByStageOrderAsc(applicationId);
        for (ApplicationStage stage : stages) {
            if (stage.getStageOrder() > currentOrder &&
                    stage.getStatus() == StageStatus.PENDING) {
                return stage;
            }
        }
        return null;
    }

    private ApplicationStageDto toDto(ApplicationStage stage) {
        return ApplicationStageDto.builder()
                .id(stage.getId())
                .applicationId(stage.getApplicationId())
                .stageOrder(stage.getStageOrder())
                .stageType(stage.getStageType())
                .interviewMode(stage.getInterviewMode() != null ? stage.getInterviewMode() : InterviewMode.AI)
                .status(stage.getStatus())
                .minimumScore(stage.getMinimumScore())
                .actualScore(stage.getActualScore())
                .scheduledInterviewId(stage.getScheduledInterviewId())
                .startedAt(stage.getStartedAt())
                .completedAt(stage.getCompletedAt())
                .feedback(stage.getFeedback())
                .isCompleted(stage.getStatus() == StageStatus.APPROVED ||
                        stage.getStatus() == StageStatus.REJECTED ||
                        stage.getStatus() == StageStatus.SKIPPED)
                .isLocked(stage.getStatus() == StageStatus.PENDING &&
                        !isNextStage(stage))
                .build();
    }

    private boolean isNextStage(ApplicationStage stage) {
        Application application = applicationRepository.findById(stage.getApplicationId()).orElseThrow();
        Integer currentOrder = application.getCurrentStageOrder() != null ?
                application.getCurrentStageOrder() : 1;
        return stage.getStageOrder() == currentOrder;
    }
}