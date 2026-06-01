package com.aiinterview.face2hire_backend.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionStartedDto {
    private Long sessionId;
    private Long firstQuestionId;
    private Integer totalQuestions;
    private Integer durationSeconds;
}