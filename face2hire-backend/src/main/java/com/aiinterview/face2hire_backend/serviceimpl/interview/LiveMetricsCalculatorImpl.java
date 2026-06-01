package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.LiveMetricsDto;
import com.aiinterview.face2hire_backend.service.interview.LiveMetricsCalculator;
import org.springframework.stereotype.Service;
import java.util.regex.Pattern;

@Service
public class LiveMetricsCalculatorImpl implements LiveMetricsCalculator {

    private static final Pattern FILLER_PATTERN = Pattern.compile("\\b(um|uh|like|you know|actually|basically)\\b", Pattern.CASE_INSENSITIVE);

    @Override
    public LiveMetricsDto computeMetrics(String partialTranscript, int durationMs) {
        int fillerCount = (int) FILLER_PATTERN.matcher(partialTranscript).results().count();
        int wordCount = partialTranscript.trim().isEmpty() ? 0 : partialTranscript.split("\\s+").length;
        double durationMinutes = durationMs / 60000.0;
        int wpm = durationMinutes > 0 ? (int) (wordCount / durationMinutes) : 0;
        double confidence = 0.85;

        return LiveMetricsDto.builder()
                .partialTranscript(partialTranscript)
                .fillerWordCount(fillerCount)
                .speakingRateWpm(wpm)
                .confidence(confidence)
                .build();
    }
}