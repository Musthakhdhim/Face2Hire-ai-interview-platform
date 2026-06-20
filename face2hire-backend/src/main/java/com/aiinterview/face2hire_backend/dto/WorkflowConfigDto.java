package com.aiinterview.face2hire_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WorkflowConfigDto {
    private List<StageConfigDto> stages;
    private Boolean enabled;
}