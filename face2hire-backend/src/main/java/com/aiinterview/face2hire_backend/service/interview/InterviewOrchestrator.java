package com.aiinterview.face2hire_backend.service.interview;

import com.aiinterview.face2hire_backend.dto.interview.*;
import com.aiinterview.face2hire_backend.entity.interview.InterviewSession;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.annotation.PostConstruct;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface InterviewOrchestrator {
    @PostConstruct
    void init();

    @Transactional
    SessionStartedDto start(Long userId, StartSessionRequest request) throws JsonProcessingException;

    @Transactional
    FeedbackResponseDto submitAnswer(Long userId, AnswerSubmissionDto dto) throws JsonProcessingException;

    @Transactional
    QuestionResponseDto getNextQuestion(Long sessionId, Long currentQuestionId, Long userId) throws JsonProcessingException;

    @Transactional
    OverallFeedbackDto endSession(Long sessionId, Long userId) throws JsonProcessingException;

    QuestionResponseDto getCurrentQuestionForSession(Long sessionId, Long userId);

    default OverallFeedbackDto createDefaultFeedback(String reason) {
        return OverallFeedbackDto.builder()
                .overallScore(0.0)
                .communicationScore(0.0)
                .technicalScore(0.0)
                .confidenceScore(0.0)
                .strengths("Incomplete interview")
                .improvements("Please complete the full interview to receive detailed feedback.")
                .detailedFeedback(reason)
                .suggestedResources(List.of())
                .build();
    }

    List<InterviewSessionDto> getUserSessions(Long userId);

    default InterviewSessionDto toSessionDto(InterviewSession session) {
        return InterviewSessionDto.builder()
                .id(session.getId())
                .type(session.getType())
                .difficulty(session.getDifficulty())
                .duration(session.getDuration())
                .questionCount(session.getQuestionCount())
                .avatarStyle(session.getAvatarStyle())
                .status(session.getStatus())
                .overallScore(session.getOverallScore())
                .communicationScore(session.getCommunicationScore())
                .technicalScore(session.getTechnicalScore())
                .confidenceScore(session.getConfidenceScore())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .createdAt(session.getCreatedAt())
                .scheduledInterviewId(session.getScheduledInterviewId())
                .build();
    }

    OverallFeedbackDto getOverallFeedback(Long sessionId, Long userId);

    OverallFeedbackDto getOverallFeedbackByScheduledId(Long scheduledId, Long userId);

    SessionStateDto getActiveSession(Long userId);

    SessionDetailDto getSessionDetail(Long sessionId, Long userId);
}
