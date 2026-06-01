package com.aiinterview.face2hire_backend.service.interview;

import com.aiinterview.face2hire_backend.entity.interview.InterviewQuestion;
import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import com.aiinterview.face2hire_backend.entity.interview.Difficulty;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.util.List;

public interface QuestionGenerator {
    List<InterviewQuestion> generateQuestions(Long sessionId, Long userId,
                                              InterviewType type, Difficulty difficulty,
                                              int questionCount) throws JsonProcessingException;
}