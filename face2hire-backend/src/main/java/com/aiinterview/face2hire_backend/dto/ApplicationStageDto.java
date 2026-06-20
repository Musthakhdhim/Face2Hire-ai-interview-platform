package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.StageStatus;
import com.aiinterview.face2hire_backend.entity.StageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApplicationStageDto {
    private Long id;
    private Long applicationId;
    private Integer stageOrder;
    private StageType stageType;
    private StageStatus status;
    private Double minimumScore;
    private Double actualScore;
    private Long scheduledInterviewId;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String feedback;
    private Boolean isCompleted;
    private Boolean isLocked;
}