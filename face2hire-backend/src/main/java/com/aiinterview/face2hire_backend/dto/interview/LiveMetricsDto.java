package com.aiinterview.face2hire_backend.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiveMetricsDto {
    private Long questionId;
    private String partialTranscript;
    private Integer fillerWordCount;
    private Integer speakingRateWpm;
    private Double confidence;
}