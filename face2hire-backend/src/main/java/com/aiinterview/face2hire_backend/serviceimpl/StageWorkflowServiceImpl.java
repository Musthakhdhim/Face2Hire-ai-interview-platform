package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.ApplicationStageDto;
import com.aiinterview.face2hire_backend.dto.StageConfigDto;
import com.aiinterview.face2hire_backend.dto.WorkflowConfigDto;
import com.aiinterview.face2hire_backend.entity.*;
import com.aiinterview.face2hire_backend.exception.ResourceNotFoundException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.ApplicationRepository;
import com.aiinterview.face2hire_backend.repository.ApplicationStageRepository;
import com.aiinterview.face2hire_backend.repository.JobRepository;
import com.aiinterview.face2hire_backend.repository.interview.ScheduledInterviewRepository;
import com.aiinterview.face2hire_backend.service.ActivityLogService;
import com.aiinterview.face2hire_backend.service.NotificationService;
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
    private final NotificationService notificationService;
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
                .order(1)
                .minimumScore(70.0)
                .duration(45)
                .questionCount(10)
                .required(true)
                .description("Technical skills assessment")
                .build());
        stages.add(StageConfigDto.builder()
                .stageType(StageType.HR)
                .order(2)
                .minimumScore(65.0)
                .duration(30)
                .questionCount(8)
                .required(true)
                .description("Cultural fit and soft skills")
                .build());
        stages.add(StageConfigDto.builder()
                .stageType(StageType.BEHAVIORAL)
                .order(3)
                .minimumScore(70.0)
                .duration(30)
                .questionCount(8)
                .required(true)
                .description("Behavioral and situational assessment")
                .build());
        stages.add(StageConfigDto.builder()
                .stageType(StageType.SALARY)
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

        return toDto(stage);
    }

    @Override
    @Transactional
    public ApplicationStageDto approveStage(Long applicationId, Long stageId, Double score, String feedback) {
        ApplicationStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));

        if (!stage.getApplicationId().equals(applicationId)) {
            throw new RuntimeException("Stage does not belong to this application");
        }

        stage.setStatus(StageStatus.APPROVED);
        stage.setActualScore(score);
        stage.setFeedback(feedback);
        stage.setCompletedAt(LocalDateTime.now());
        stageRepository.save(stage);

        Application application = applicationRepository.findById(applicationId).orElseThrow();

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
        return toDto(stage);
    }

    @Override
    @Transactional
    public ApplicationStageDto rejectStage(Long applicationId, Long stageId, String feedback) {
        ApplicationStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));

        if (!stage.getApplicationId().equals(applicationId)) {
            throw new RuntimeException("Stage does not belong to this application");
        }

        stage.setStatus(StageStatus.REJECTED);
        stage.setFeedback(feedback);
        stage.setCompletedAt(LocalDateTime.now());
        stageRepository.save(stage);

        Application application = applicationRepository.findById(applicationId).orElseThrow();
        application.setOverallResult(OverallResult.FAILED);
        applicationRepository.save(application);

        String jobTitle = getJobTitle(application.getJobId());

        notificationService.createNotification(
                application.getUserId(),
                "Application Update",
                "Your application for " + jobTitle + " was not successful in the " + stage.getStageType() + " round.",
                "APPLICATION_REJECTED"
        );

        log.info("Stage {} rejected for application {}", stage.getStageType(), applicationId);
        return toDto(stage);
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
            ApplicationStage stage = ApplicationStage.builder()
                    .applicationId(application.getId())
                    .stageOrder(stageConfig.getOrder())
                    .stageType(stageConfig.getStageType())
                    .status(StageStatus.PENDING)
                    .minimumScore(stageConfig.getMinimumScore())
                    .build();
            stages.add(stage);
            log.info("Created stage: {} with order: {}", stageConfig.getStageType(), stageConfig.getOrder());
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