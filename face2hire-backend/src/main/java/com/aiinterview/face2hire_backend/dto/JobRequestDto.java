package com.aiinterview.face2hire_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import com.aiinterview.face2hire_backend.entity.JobType;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class JobRequestDto {
    private String title;
    private String company;
    private String location;
    private JobType type;
    private String salary;
    private Integer requiredExperience;
    private String description;
    private List<String> skills;

    private Boolean hasMultiRound;
    private WorkflowConfigDto workflowConfig;
}