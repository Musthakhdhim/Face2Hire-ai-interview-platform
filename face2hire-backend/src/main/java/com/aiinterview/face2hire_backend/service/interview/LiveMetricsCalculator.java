package com.aiinterview.face2hire_backend.service.interview;

import com.aiinterview.face2hire_backend.dto.interview.LiveMetricsDto;

public interface LiveMetricsCalculator {
    LiveMetricsDto computeMetrics(String partialTranscript, int durationMs);
}