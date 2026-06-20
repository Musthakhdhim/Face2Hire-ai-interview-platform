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
public class ApplicationWithStagesDto {
    private ApplicationResponseDto application;
    private List<ApplicationStageDto> stages;
    private ApplicationStageDto currentStage;
}