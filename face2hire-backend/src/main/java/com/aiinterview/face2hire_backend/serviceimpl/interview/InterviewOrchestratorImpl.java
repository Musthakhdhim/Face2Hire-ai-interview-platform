package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.*;
import com.aiinterview.face2hire_backend.entity.ApplicationStatus;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.entity.interview.*;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.ApplicationRepository;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.repository.interview.*;
import com.aiinterview.face2hire_backend.service.interview.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
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
    private final ScheduledInterviewRepository scheduledInterviewRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Transactional
    public SessionStartedDto start(Long userId, StartSessionRequest request) throws JsonProcessingException {
        log.info("Orchestrator: starting interview for user {}", userId);
        return sessionManager.startSession(userId, request);
    }

    @Transactional
    public FeedbackResponseDto submitAnswer(Long userId, AnswerSubmissionDto dto) throws JsonProcessingException {
        log.info("Orchestrator: submitting answer for user {}, session {}, question {}",
                userId, dto.getSessionId(), dto.getQuestionId());

        InterviewSession session = sessionRepository.findById(dto.getSessionId())
                .orElseThrow(() -> {
                    log.error("Session {} not found", dto.getSessionId());
                    return new RuntimeException("Session not found");
                });
        if (!session.getUserId().equals(userId)) {
            log.error("User {} not owner of session {}", userId, dto.getSessionId());
            throw new RuntimeException("Unauthorized");
        }

        log.debug("Downloading audio from {}", dto.getAudioUrl());
        byte[] audioData = audioProcessor.downloadAudio(dto.getAudioUrl());
        log.debug("Audio size: {} bytes", audioData.length);

        log.debug("Transcribing audio...");
        String transcript = audioProcessor.transcribe(audioData);
        log.debug("Transcription: {}", transcript.substring(0, Math.min(200, transcript.length())));

        InterviewQuestion question = questionRepository.findById(dto.getQuestionId())
                .orElseThrow(() -> {
                    log.error("Question {} not found", dto.getQuestionId());
                    return new RuntimeException("Question not found");
                });

        log.debug("Evaluating answer...");
        FeedbackResponseDto evaluation = answerEvaluator.evaluate(question.getQuestionText(),
                question.getExpectedKeywords(), transcript, dto.getResponseDuration());
        log.info("Evaluation score: {}", evaluation.getScore());

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
        log.debug("Saved user response id={}", response.getId());

        String strengthsJson = objectMapper.writeValueAsString(evaluation.getStrengths());
        String improvementsJson = objectMapper.writeValueAsString(evaluation.getImprovements());

        QuestionFeedback feedback = QuestionFeedback.builder()
                .userResponseId(response.getId())
                .score(evaluation.getScore())
                .feedbackText(evaluation.getFeedbackText())
                .strengths(strengthsJson)
                .improvements(improvementsJson)
                .suggestedAnswer(evaluation.getSuggestedAnswer())
                .build();
        questionFeedbackRepository.save(feedback);
        log.debug("Saved question feedback id={}", feedback.getId());

        return evaluation;
    }

    @Transactional
    public QuestionResponseDto getNextQuestion(Long sessionId, Long currentQuestionId, Long userId) throws JsonProcessingException {
        log.info("Fetching next question for session {}, current={}, user={}", sessionId, currentQuestionId, userId);

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
        log.debug("Next question id={}, text={}", next.getId(), next.getQuestionText());

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
        log.info("Ending session {} for user {}", sessionId, userId);
        OverallFeedbackDto overall = null;

        try {
            sessionManager.endSession(sessionId, userId);
            List<InterviewQuestion> questions = questionRepository.findBySessionIdOrderByQuestionIndexAsc(sessionId);
            if (!questions.isEmpty()) {
                List<Long> questionIds = questions.stream().map(InterviewQuestion::getId).toList();
                List<UserResponse> responses = userResponseRepository.findByQuestionIdIn(questionIds);
                if (!responses.isEmpty()) {
                    List<Long> responseIds = responses.stream().map(UserResponse::getId).toList();
                    List<QuestionFeedback> feedbacks = questionFeedbackRepository.findAllById(responseIds);
                    if (!feedbacks.isEmpty()) {
                        overall = feedbackAggregator.aggregate(sessionId, feedbacks);
                    }
                }
            }
            if (overall == null) {
                overall = createDefaultFeedback("Incomplete or no answers recorded.");
            }
        } catch (Exception e) {
            log.error("Error while ending session", e);
            overall = createDefaultFeedback("An error occurred while generating feedback.");
        }

        InterviewFeedback feedbackEntity = InterviewFeedback.builder()
                .sessionId(sessionId)
                .overallScore(overall.getOverallScore())
                .strengths(overall.getStrengths())
                .improvements(overall.getImprovements())
                .detailedFeedback(overall.getDetailedFeedback())
                .suggestedResources(objectMapper.writeValueAsString(overall.getSuggestedResources()))
                .build();
        interviewFeedbackRepository.save(feedbackEntity);

        InterviewSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session != null) {
            session.setOverallScore(overall.getOverallScore());
            session.setCommunicationScore(overall.getCommunicationScore());
            session.setTechnicalScore(overall.getTechnicalScore());
            session.setConfidenceScore(overall.getConfidenceScore());
            sessionRepository.save(session);

            if (session.getScheduledInterviewId() != null) {
                final Double finalScore = overall.getOverallScore();
                scheduledInterviewRepository.findById(session.getScheduledInterviewId()).ifPresent(scheduled -> {
                    if (scheduled.getApplicationId() != null && scheduled.getMinimumScore() != null) {
                        applicationRepository.findById(scheduled.getApplicationId()).ifPresent(application -> {
                            application.setScore(finalScore);
                            if (finalScore < scheduled.getMinimumScore()) {
                                application.setStatus(ApplicationStatus.REJECTED);
                                log.info("Application {} auto-rejected with score {} (below minimum {})",
                                        application.getId(), finalScore, scheduled.getMinimumScore());
                            } else {
                                log.info("Application {} score {} meets minimum {}, awaiting manual approval",
                                        application.getId(), finalScore, scheduled.getMinimumScore());
                            }
                            applicationRepository.save(application);
                        });
                    }
                });
            }
        }

        return overall;
    }


    private OverallFeedbackDto createDefaultFeedback(String reason) {
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

    public List<InterviewSessionDto> getUserSessions(Long userId) {
        log.debug("Fetching all sessions for user {}", userId);
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
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .createdAt(session.getCreatedAt())
                .scheduledInterviewId(session.getScheduledInterviewId())
                .build();
    }

    public OverallFeedbackDto getOverallFeedback(Long sessionId, Long userId) {
        log.info("Fetching overall feedback for session {}, user {}", sessionId, userId);
        System.out.println("Fetching overall feedback for session , user {}"+ sessionId+", "+ userId);
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        InterviewFeedback feedback = interviewFeedbackRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("No feedback found for this session"));
        System.out.println("feedback retrieved "+feedback);
        try {
            List<String> resources = objectMapper.readValue(
                    feedback.getSuggestedResources(),
                    new TypeReference<List<String>>() {});
            return OverallFeedbackDto.builder()
                    .overallScore(feedback.getOverallScore())
                    .communicationScore(session.getCommunicationScore())
                    .technicalScore(session.getTechnicalScore())
                    .confidenceScore(session.getConfidenceScore())
                    .strengths(feedback.getStrengths())
                    .improvements(feedback.getImprovements())
                    .detailedFeedback(feedback.getDetailedFeedback())
                    .suggestedResources(resources)
                    .build();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse suggested resources", e);
        }
    }

    public OverallFeedbackDto getOverallFeedbackByScheduledId(Long scheduledId, Long userId) {
        log.info("Fetching overall feedback for scheduled interview {}, user {}", scheduledId, userId);

        // Find the interview session linked to this scheduled interview
        InterviewSession session = sessionRepository.findByScheduledInterviewId(scheduledId)
                .orElseThrow(() -> new RuntimeException("No interview session found for scheduled interview " + scheduledId));

        // Authorize: only the interviewee or the interviewer who scheduled it can view
        ScheduledInterview scheduled = scheduledInterviewRepository.findById(scheduledId)
                .orElseThrow(() -> new RuntimeException("Scheduled interview not found"));

        // Fetch the current user to get full name (for interviewer check)
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if the logged-in user is either the interviewee or the interviewer who scheduled it
        if (!session.getUserId().equals(userId) && !scheduled.getScheduledByInterviewer().equals(currentUser.getFullName())) {
            throw new RuntimeException("Unauthorized");
        }

        InterviewFeedback feedback = interviewFeedbackRepository.findBySessionId(session.getId())
                .orElseThrow(() -> new RuntimeException("No feedback found for this session"));

        try {
            List<String> resources = objectMapper.readValue(
                    feedback.getSuggestedResources(),
                    new TypeReference<List<String>>() {});
            return OverallFeedbackDto.builder()
                    .overallScore(feedback.getOverallScore())
                    .communicationScore(session.getCommunicationScore())
                    .technicalScore(session.getTechnicalScore())
                    .confidenceScore(session.getConfidenceScore())
                    .strengths(feedback.getStrengths())
                    .improvements(feedback.getImprovements())
                    .detailedFeedback(feedback.getDetailedFeedback())
                    .suggestedResources(resources)
                    .build();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse suggested resources", e);
        }
    }
}