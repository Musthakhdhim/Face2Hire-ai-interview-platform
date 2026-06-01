package com.aiinterview.face2hire_backend.service.interview;

import com.aiinterview.face2hire_backend.dto.interview.FeedbackResponseDto;

public interface AnswerEvaluator {
    FeedbackResponseDto evaluate(String questionText, String expectedKeywordsJson,
                                 String transcript, int responseDuration);
}