package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.SessionStartedDto;
import com.aiinterview.face2hire_backend.dto.interview.SessionStateDto;
import com.aiinterview.face2hire_backend.dto.interview.StartSessionRequest;
import com.aiinterview.face2hire_backend.entity.interview.InterviewSession;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import com.aiinterview.face2hire_backend.exception.InterviewSessionNotFoundException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.service.interview.InterviewSessionManager;
import com.aiinterview.face2hire_backend.service.interview.QuestionGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InterviewSessionManagerImpl implements InterviewSessionManager {

    private final InterviewSessionRepository sessionRepository;
    private final QuestionGenerator questionGenerator;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Override
    @Transactional
    public SessionStartedDto startSession(Long userId, StartSessionRequest request) throws JsonProcessingException {
        log.info("Starting new interview session for user {}, type={}, difficulty={}, duration={}, questions={}",
                userId, request.getType(), request.getDifficulty(), request.getDuration(), request.getQuestionCount());

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
        log.info("Created interview session with id={}", session.getId());

        log.debug("Calling question generator for session {}", session.getId());
        var questions = questionGenerator.generateQuestions(session.getId(), userId,
                request.getType(), request.getDifficulty(), request.getQuestionCount());

        if (questions == null || questions.isEmpty()) {
            log.error("No questions generated for session {}", session.getId());
            throw new RuntimeException("Failed to generate questions");
        }
        log.info("Generated {} questions for session {}", questions.size(), session.getId());

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
        log.info("Ending session {} for user {}", sessionId, userId);
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> {
                    log.error("Session {} not found", sessionId);
                    return new InterviewSessionNotFoundException("Session not found");
                });
        if (!session.getUserId().equals(userId)) {
            log.error("User {} not authorized to end session {}", userId, sessionId);
            throw new RuntimeException("Unauthorized");
        }
        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);
        log.info("Session {} completed", sessionId);
    }

    @Override
    public SessionStateDto getSessionState(Long sessionId, Long userId) {
        log.debug("Getting state for session {} user {}", sessionId, userId);
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> {
                    log.error("Session {} not found", sessionId);
                    return new InterviewSessionNotFoundException("Session not found");
                });
        if (!session.getUserId().equals(userId)) {
            log.error("User {} not authorized to view session {}", userId, sessionId);
            throw new RuntimeException("Unauthorized");
        }
        return SessionStateDto.builder()
                .sessionId(sessionId)
                .totalQuestions(session.getQuestionCount())
                .remainingTimeSeconds(0)
                .status(session.getStatus())
                .build();
    }
}