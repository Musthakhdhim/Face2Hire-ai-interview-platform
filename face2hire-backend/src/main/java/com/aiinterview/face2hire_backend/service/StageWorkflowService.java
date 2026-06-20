package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.ApplicationStageDto;
import com.aiinterview.face2hire_backend.dto.StageConfigDto;
import com.aiinterview.face2hire_backend.dto.WorkflowConfigDto;
import com.aiinterview.face2hire_backend.entity.Application;
import com.aiinterview.face2hire_backend.entity.ApplicationStage;
import com.aiinterview.face2hire_backend.entity.StageStatus;
import com.aiinterview.face2hire_backend.entity.StageType;

import java.util.List;

public interface StageWorkflowService {
    WorkflowConfigDto getDefaultWorkflowConfig();
    List<ApplicationStageDto> getApplicationStages(Long applicationId);
    ApplicationStageDto getCurrentStage(Long applicationId);
    ApplicationStageDto startStage(Long applicationId, Long stageId, Long scheduledInterviewId);
    ApplicationStageDto approveStage(Long applicationId, Long stageId, Double score, String feedback);
    ApplicationStageDto rejectStage(Long applicationId, Long stageId, String feedback);
    ApplicationStageDto skipStage(Long applicationId, Long stageId, String reason);
    ApplicationStageDto getStageById(Long stageId);
    boolean isAllStagesCompleted(Long applicationId);
    boolean hasReachedFinalStage(Long applicationId);
    ApplicationStageDto getNextStage(Long applicationId);
    List<StageType> getCompletedStages(Long applicationId);
    ApplicationStage getCurrentStageEntity(Long applicationId);
    void initializeStagesForApplication(Application application, WorkflowConfigDto config);

    ApplicationStage saveStage(ApplicationStage stage);

}