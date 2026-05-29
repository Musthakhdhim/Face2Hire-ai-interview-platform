package com.aiinterview.face2hire_backend.dto.interview;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SessionStartedDto {
    private Long sessionId;
    private Long firstQuestionId;
    private Integer totalQuestions;
    private Integer durationSeconds;
}