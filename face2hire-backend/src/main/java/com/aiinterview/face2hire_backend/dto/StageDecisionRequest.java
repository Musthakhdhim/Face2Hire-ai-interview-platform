package com.aiinterview.face2hire_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StageDecisionRequest {
    private Long stageId;
    private Boolean approved;
    private String feedback;
}