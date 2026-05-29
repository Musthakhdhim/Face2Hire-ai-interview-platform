package com.aiinterview.face2hire_backend.service.interview;

import com.aiinterview.face2hire_backend.dto.interview.SessionStateDto;
import com.aiinterview.face2hire_backend.dto.interview.SessionStartedDto;
import com.aiinterview.face2hire_backend.dto.interview.StartSessionRequest;
import com.fasterxml.jackson.core.JsonProcessingException;

public interface InterviewSessionManager {
    SessionStartedDto startSession(Long userId, StartSessionRequest request) throws JsonProcessingException;
    void endSession(Long sessionId, Long userId);
    SessionStateDto getSessionState(Long sessionId, Long userId);
}