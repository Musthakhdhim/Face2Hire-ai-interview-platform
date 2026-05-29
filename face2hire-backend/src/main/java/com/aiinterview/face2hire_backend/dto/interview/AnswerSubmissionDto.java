package com.aiinterview.face2hire_backend.dto.interview;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class AnswerSubmissionDto {
    @NotNull
    private Long sessionId;
    @NotNull
    private Long questionId;
    @NotNull
    private String audioUrl;
    private Integer responseDuration;
}