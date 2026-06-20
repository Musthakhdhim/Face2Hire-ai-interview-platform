package com.aiinterview.face2hire_backend.dto;

import lombok.Builder;
import lombok.Data;
import com.aiinterview.face2hire_backend.entity.JobStatus;
import com.aiinterview.face2hire_backend.entity.JobType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class JobResponseDto {
    private Long id;
    private String title;
    private String company;
    private String location;
    private JobType type;
    private String salary;
    private Integer matchPercentage;
    private Integer requiredExperience;
    private String description;
    private Long postedByUserId;
    private Integer applicantsCount;
    private JobStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> skills;

    private Boolean hasMultiRound;
    private WorkflowConfigDto workflowConfig;
}