package com.aiinterview.face2hire_backend.dto.interview;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LiveMetricsDto {
    private Long questionId;
    private String partialTranscript;
    private Integer fillerWordCount;
    private Integer speakingRateWpm;
    private Double confidence;
}