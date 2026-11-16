package com.aiinterview.face2hire_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StageDecisionRequest {
    private Long stageId;
    private Boolean approved;
    private Double score;
    private Double communicationScore;
    private Double technicalScore;
    private Double confidenceScore;
    private String strengths;
    private String improvements;
    private String feedback;
}