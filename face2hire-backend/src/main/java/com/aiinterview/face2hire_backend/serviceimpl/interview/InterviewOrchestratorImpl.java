package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.*;
import com.aiinterview.face2hire_backend.entity.interview.*;
import com.aiinterview.face2hire_backend.repository.interview.*;
import com.aiinterview.face2hire_backend.service.interview.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewOrchestratorImpl {

    private final InterviewSessionManager sessionManager;
    private final QuestionGenerator questionGenerator;
    private final AudioProcessor audioProcessor;
    private final AnswerEvaluator answerEvaluator;
    private final FeedbackAggregator feedbackAggregator;
    private final LiveMetricsCalculator metricsCalculator;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final UserResponseRepository userResponseRepository;
    private final QuestionFeedbackRepository questionFeedbackRepository;
    private final InterviewFeedbackRepository interviewFeedbackRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public SessionStartedDto start(Long userId, StartSessionRequest request) throws JsonProcessingException {
        return sessionManager.startSession(userId, request);
    }

    @Transactional
    public FeedbackResponseDto submitAnswer(Long userId, AnswerSubmissionDto dto) throws JsonProcessingException {
        // Verify session belongs to user
        InterviewSession session = sessionRepository.findById(dto.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Download and transcribe audio
        byte[] audioData = audioProcessor.downloadAudio(dto.getAudioUrl());
        String transcript = audioProcessor.transcribe(audioData);

        // Get question details
        InterviewQuestion question = questionRepository.findById(dto.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Question not found"));

        // Evaluate
        FeedbackResponseDto evaluation = answerEvaluator.evaluate(question.getQuestionText(),
                question.getExpectedKeywords(), transcript, dto.getResponseDuration());

        // Save UserResponse
        UserResponse response = UserResponse.builder()
                .questionId(dto.getQuestionId())
                .audioUrl(dto.getAudioUrl())
                .transcribedText(transcript)
                .responseDuration(dto.getResponseDuration())
                .keywordsMatched(objectMapper.writeValueAsString(evaluation.getKeywordsMatched()))
                .keywordsMissing(objectMapper.writeValueAsString(evaluation.getKeywordsMissing()))
                .grammarIssues(objectMapper.writeValueAsString(evaluation.getGrammarIssues()))
                .build();
        response = userResponseRepository.save(response);

        // Save QuestionFeedback
        QuestionFeedback feedback = QuestionFeedback.builder()
                .userResponseId(response.getId())
                .score(evaluation.getScore())
                .feedbackText(evaluation.getFeedbackText())
                .strengths(evaluation.getStrengths())
                .improvements(evaluation.getImprovements())
                .suggestedAnswer(evaluation.getSuggestedAnswer())
                .build();
        questionFeedbackRepository.save(feedback);

        return evaluation;
    }

    @Transactional
    public QuestionResponseDto getNextQuestion(Long sessionId, Long currentQuestionId, Long userId) throws JsonProcessingException {
        // Verify ownership
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        List<InterviewQuestion> questions = questionRepository.findBySessionIdOrderByQuestionIndexAsc(sessionId);
        int currentIndex = -1;
        for (int i = 0; i < questions.size(); i++) {
            if (questions.get(i).getId().equals(currentQuestionId)) {
                currentIndex = i;
                break;
            }
        }
        if (currentIndex + 1 >= questions.size()) {
            throw new RuntimeException("No more questions");
        }
        InterviewQuestion next = questions.get(currentIndex + 1);
        return QuestionResponseDto.builder()
                .questionId(next.getId())
                .questionIndex(next.getQuestionIndex())
                .questionText(next.getQuestionText())
                .category(next.getCategory())
                .expectedKeywords(objectMapper.readValue(next.getExpectedKeywords(), List.class))
                .build();
    }

    @Transactional
    public OverallFeedbackDto endSession(Long sessionId, Long userId) throws JsonProcessingException {
        sessionManager.endSession(sessionId, userId);

        // Fetch all question feedback for this session
        List<InterviewQuestion> questions = questionRepository.findBySessionIdOrderByQuestionIndexAsc(sessionId);
        List<Long> questionIds = questions.stream().map(InterviewQuestion::getId).toList();
        List<UserResponse> responses = userResponseRepository.findByQuestionIdIn(questionIds);
        List<Long> responseIds = responses.stream().map(UserResponse::getId).toList();
        List<QuestionFeedback> feedbacks = questionFeedbackRepository.findAllById(responseIds); // not exactly, need mapping

        OverallFeedbackDto overall = feedbackAggregator.aggregate(sessionId, feedbacks);

        // Save InterviewFeedback
        InterviewFeedback feedbackEntity = InterviewFeedback.builder()
                .sessionId(sessionId)
                .overallScore(overall.getOverallScore())
                .strengths(overall.getStrengths())
                .improvements(overall.getImprovements())
                .detailedFeedback(overall.getDetailedFeedback())
                .suggestedResources(objectMapper.writeValueAsString(overall.getSuggestedResources()))
                .build();
        interviewFeedbackRepository.save(feedbackEntity);

        // Update session scores
        InterviewSession session = sessionRepository.findById(sessionId).get();
        session.setOverallScore(overall.getOverallScore());
        session.setCommunicationScore(overall.getCommunicationScore());
        session.setTechnicalScore(overall.getTechnicalScore());
        session.setConfidenceScore(overall.getConfidenceScore());
        sessionRepository.save(session);

        return overall;
    }

    public List<InterviewSessionDto> getUserSessions(Long userId) {
        List<InterviewSession> sessions = sessionRepository.findByUserId(userId);
        return sessions.stream()
                .map(this::toSessionDto)
                .collect(Collectors.toList());
    }

    private InterviewSessionDto toSessionDto(InterviewSession session) {
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
                .startedAt(session.getStartedAt())      // LocalDateTime, not String
                .completedAt(session.getCompletedAt())  // LocalDateTime (can be null)
                .createdAt(session.getCreatedAt())      // LocalDateTime
                .scheduledInterviewId(session.getScheduledInterviewId())
                .build();
    }
}