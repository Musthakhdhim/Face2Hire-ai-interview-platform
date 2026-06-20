package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.StageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StageConfigDto {
    private StageType stageType;
    private Integer order;
    private Double minimumScore;
    private Integer duration;
    private Integer questionCount;
    private Boolean required;
    private String description;
}