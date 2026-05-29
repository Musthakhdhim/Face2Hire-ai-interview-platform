package com.aiinterview.face2hire_backend.dto.interview;

import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SessionStateDto {
    private Long sessionId;
    private Long currentQuestionId;
    private Integer currentQuestionIndex;
    private Integer totalQuestions;
    private Integer remainingTimeSeconds;
    private SessionStatus status;
}