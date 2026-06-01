package com.aiinterview.face2hire_backend.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerSubmissionDto {
    @NotNull
    private Long sessionId;
    @NotNull
    private Long questionId;
    @NotNull
    private String audioUrl;
    private Integer responseDuration;
}