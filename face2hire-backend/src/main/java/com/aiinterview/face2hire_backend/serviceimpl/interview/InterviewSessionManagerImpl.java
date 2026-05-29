package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.*;
import com.aiinterview.face2hire_backend.entity.interview.*;
import com.aiinterview.face2hire_backend.exception.InterviewSessionNotFoundException;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.service.interview.InterviewSessionManager;
import com.aiinterview.face2hire_backend.service.interview.QuestionGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InterviewSessionManagerImpl implements InterviewSessionManager {

    private final InterviewSessionRepository sessionRepository;
    private final QuestionGenerator questionGenerator;

    @Override
    @Transactional
    public SessionStartedDto startSession(Long userId, StartSessionRequest request) throws JsonProcessingException {
        // Create session
        InterviewSession session = InterviewSession.builder()
                .userId(userId)
                .type(request.getType())
                .difficulty(request.getDifficulty())
                .duration(request.getDuration())
                .questionCount(request.getQuestionCount())
                .avatarStyle(request.getAvatarStyle())
                .isScheduled(request.getScheduledInterviewId() != null)
                .scheduledInterviewId(request.getScheduledInterviewId())
                .build();
        session = sessionRepository.save(session);

        // Generate questions based on user's CV skills
        var questions = questionGenerator.generateQuestions(session.getId(), userId,
                request.getType(), request.getDifficulty(), request.getQuestionCount());

        if (questions.isEmpty()) {
            throw new RuntimeException("Failed to generate questions");
        }

        return SessionStartedDto.builder()
                .sessionId(session.getId())
                .firstQuestionId(questions.get(0).getId())
                .totalQuestions(questions.size())
                .durationSeconds(request.getDuration() * 60)
                .build();
    }

    @Override
    @Transactional
    public void endSession(Long sessionId, Long userId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new InterviewSessionNotFoundException("Session not found"));
        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    @Override
    public SessionStateDto getSessionState(Long sessionId, Long userId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new InterviewSessionNotFoundException("Session not found"));
        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        // In a real implementation, we'd also fetch current question index from somewhere
        // For now, return basic info
        return SessionStateDto.builder()
                .sessionId(sessionId)
                .totalQuestions(session.getQuestionCount())
                .remainingTimeSeconds(0) // will be computed from start time + duration
                .status(session.getStatus())
                .build();
    }
}
