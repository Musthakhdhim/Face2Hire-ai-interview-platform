package com.aiinterview.face2hire_backend.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverallFeedbackDto {
    private Double overallScore;
    private Double communicationScore;
    private Double technicalScore;
    private Double confidenceScore;
    private String strengths;
    private String improvements;
    private String detailedFeedback;
    private List<String> suggestedResources;
}