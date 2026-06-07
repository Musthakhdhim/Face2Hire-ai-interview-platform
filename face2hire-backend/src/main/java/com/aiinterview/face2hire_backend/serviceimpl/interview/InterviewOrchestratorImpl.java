package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.*;
import com.aiinterview.face2hire_backend.entity.ActivityAction;
import com.aiinterview.face2hire_backend.entity.ApplicationStatus;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.entity.interview.*;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.ApplicationRepository;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.repository.interview.*;
import com.aiinterview.face2hire_backend.service.ActivityLogService;
import com.aiinterview.face2hire_backend.service.NotificationService;
import com.aiinterview.face2hire_backend.service.interview.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewOrchestratorImpl implements InterviewOrchestrator {

    private final InterviewSessionManager sessionManager;
    private final QuestionGenerator questionGenerator;
    private final AudioProcessor audioProcessor;
    private final AnswerEvaluator answerEvaluator;
    private final FeedbackAggregator feedbackAggregator;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final UserResponseRepository userResponseRepository;
    private final QuestionFeedbackRepository questionFeedbackRepository;
    private final InterviewFeedbackRepository interviewFeedbackRepository;
    private final ObjectMapper objectMapper;
    private final ScheduledInterviewRepository scheduledInterviewRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    @Override
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Transactional
    @Override
    public SessionStartedDto start(Long userId, StartSessionRequest request) throws JsonProcessingException {
        log.info("Orchestrator: starting interview for user {}", userId);
        return sessionManager.startSession(userId, request);
    }

    @Transactional
    @Override
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
    @Override
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
    @Override
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

        // Activity log
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && overall != null && session != null) {
                activityLogService.log(user, ActivityAction.INTERVIEW_COMPLETED,
                        String.format("Completed interview session %d | Type: %s | Score: %.1f%%",
                                sessionId, session.getType(), overall.getOverallScore()));
            }
        } catch (Exception e) {
            log.warn("Failed to log interview completion activity: {}", e.getMessage());
        }

        // --- Send notification to interviewer if this was a scheduled interview ---
        if (session != null && session.getScheduledInterviewId() != null && overall != null) {
            try {
                final Double finalOverallScore = overall.getOverallScore(); // make final for lambda
                scheduledInterviewRepository.findById(session.getScheduledInterviewId()).ifPresent(scheduled -> {
                    String interviewerEmail = scheduled.getScheduledByInterviewer();
                    if (interviewerEmail != null) {
                        User interviewer = userRepository.findByEmail(interviewerEmail);
                        if (interviewer != null) {
                            String candidateName = userRepository.findById(userId)
                                    .map(u -> u.getFullName() != null ? u.getFullName() : u.getUserName())
                                    .orElse("User");
                            notificationService.createNotification(
                                    interviewer.getId(),
                                    "Interview Completed",
                                    String.format("Candidate %s completed the scheduled interview. Score: %.1f%%", candidateName, finalOverallScore),
                                    "INTERVIEW_COMPLETED"
                            );
                        }
                    }
                });
            } catch (Exception e) {
                log.warn("Failed to send notification for interview completion: {}", e.getMessage());
            }
        }

        return overall;
    }

//    @Transactional
//    @Override
//    public OverallFeedbackDto endSession(Long sessionId, Long userId) throws JsonProcessingException {
//        log.info("Ending session {} for user {}", sessionId, userId);
//        OverallFeedbackDto overall = null;
//
//        try {
//            sessionManager.endSession(sessionId, userId);
//            List<InterviewQuestion> questions = questionRepository.findBySessionIdOrderByQuestionIndexAsc(sessionId);
//            if (!questions.isEmpty()) {
//                List<Long> questionIds = questions.stream().map(InterviewQuestion::getId).toList();
//                List<UserResponse> responses = userResponseRepository.findByQuestionIdIn(questionIds);
//                if (!responses.isEmpty()) {
//                    List<Long> responseIds = responses.stream().map(UserResponse::getId).toList();
//                    List<QuestionFeedback> feedbacks = questionFeedbackRepository.findAllById(responseIds);
//                    if (!feedbacks.isEmpty()) {
//                        overall = feedbackAggregator.aggregate(sessionId, feedbacks);
//                    }
//                }
//            }
//            if (overall == null) {
//                overall = createDefaultFeedback("Incomplete or no answers recorded.");
//            }
//        } catch (Exception e) {
//            log.error("Error while ending session", e);
//            overall = createDefaultFeedback("An error occurred while generating feedback.");
//        }
//
//        InterviewFeedback feedbackEntity = InterviewFeedback.builder()
//                .sessionId(sessionId)
//                .overallScore(overall.getOverallScore())
//                .strengths(overall.getStrengths())
//                .improvements(overall.getImprovements())
//                .detailedFeedback(overall.getDetailedFeedback())
//                .suggestedResources(objectMapper.writeValueAsString(overall.getSuggestedResources()))
//                .build();
//        interviewFeedbackRepository.save(feedbackEntity);
//
//        InterviewSession session = sessionRepository.findById(sessionId).orElse(null);
//        if (session != null) {
//            session.setOverallScore(overall.getOverallScore());
//            session.setCommunicationScore(overall.getCommunicationScore());
//            session.setTechnicalScore(overall.getTechnicalScore());
//            session.setConfidenceScore(overall.getConfidenceScore());
//            sessionRepository.save(session);
//
//            if (session.getScheduledInterviewId() != null) {
//                final Double finalScore = overall.getOverallScore();
//                scheduledInterviewRepository.findById(session.getScheduledInterviewId()).ifPresent(scheduled -> {
//                    if (scheduled.getApplicationId() != null && scheduled.getMinimumScore() != null) {
//                        applicationRepository.findById(scheduled.getApplicationId()).ifPresent(application -> {
//                            application.setScore(finalScore);
//                            if (finalScore < scheduled.getMinimumScore()) {
//                                application.setStatus(ApplicationStatus.REJECTED);
//                                log.info("Application {} auto-rejected with score {} (below minimum {})",
//                                        application.getId(), finalScore, scheduled.getMinimumScore());
//                            } else {
//                                log.info("Application {} score {} meets minimum {}, awaiting manual approval",
//                                        application.getId(), finalScore, scheduled.getMinimumScore());
//                            }
//                            applicationRepository.save(application);
//                        });
//                    }
//                });
//            }
//        }
//
//        try {
//            User user = userRepository.findById(userId).orElse(null);
//            if (user != null && overall != null && session != null) {
//                activityLogService.log(user, ActivityAction.INTERVIEW_COMPLETED,
//                        String.format("Completed interview session %d | Type: %s | Score: %.1f%%",
//                                sessionId, session.getType(), overall.getOverallScore()));
//            }
//        } catch (Exception e) {
//            log.warn("Failed to log interview completion activity: {}", e.getMessage());
//        }
//
//        return overall;
//    }

    @Override
    public List<InterviewSessionDto> getUserSessions(Long userId) {
        log.debug("Fetching all sessions for user {}", userId);
        List<InterviewSession> sessions = sessionRepository.findByUserId(userId);
        return sessions.stream()
                .map(this::toSessionDto)
                .collect(Collectors.toList());
    }

    @Override
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

    @Override
    public OverallFeedbackDto getOverallFeedbackByScheduledId(Long scheduledId, Long userId) {
        log.info("Fetching overall feedback for scheduled interview {}, user {}", scheduledId, userId);

        InterviewSession session = sessionRepository.findByScheduledInterviewId(scheduledId)
                .orElseThrow(() -> new RuntimeException("No interview session found for scheduled interview " + scheduledId));

        ScheduledInterview scheduled = scheduledInterviewRepository.findById(scheduledId)
                .orElseThrow(() -> new RuntimeException("Scheduled interview not found"));

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!session.getUserId().equals(userId) && !scheduled.getScheduledByInterviewer().equals(currentUser.getEmail())) {
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

    @Override
    public SessionDetailDto getSessionDetail(Long sessionId, Long userId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        List<InterviewQuestion> questions = questionRepository.findBySessionIdOrderByQuestionIndexAsc(sessionId);
        List<SessionDetailDto.QuestionDetail> questionDetails = new ArrayList<>();

        for (InterviewQuestion q : questions) {
            UserResponse response = userResponseRepository.findByQuestionId(q.getId()).orElse(null);
            QuestionFeedback feedback = null;
            if (response != null) {
                feedback = questionFeedbackRepository.findByUserResponseId(response.getId()).orElse(null);
            }

            List<String> expectedKeywords = parseJsonList(q.getExpectedKeywords());
            List<String> keywordsMatched = response != null ? parseJsonList(response.getKeywordsMatched()) : null;
            List<String> keywordsMissing = response != null ? parseJsonList(response.getKeywordsMissing()) : null;
            List<String> grammarIssues = response != null ? parseJsonList(response.getGrammarIssues()) : null;

            SessionDetailDto.QuestionDetail qd = SessionDetailDto.QuestionDetail.builder()
                    .questionId(q.getId())
                    .questionIndex(q.getQuestionIndex())
                    .questionText(q.getQuestionText())
                    .category(q.getCategory())
                    .expectedKeywords(expectedKeywords)
                    .transcribedText(response != null ? response.getTranscribedText() : null)
                    .responseDuration(response != null ? response.getResponseDuration() : null)
                    .keywordsMatched(keywordsMatched)
                    .keywordsMissing(keywordsMissing)
                    .grammarIssues(grammarIssues)
                    .score(feedback != null ? feedback.getScore() : null)
                    .feedbackText(feedback != null ? feedback.getFeedbackText() : null)
                    .strengths(feedback != null ? feedback.getStrengths() : null)
                    .improvements(feedback != null ? feedback.getImprovements() : null)
                    .suggestedAnswer(feedback != null ? feedback.getSuggestedAnswer() : null)
                    .build();

            questionDetails.add(qd);
        }

        return SessionDetailDto.builder()
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
                .questions(questionDetails)
                .build();
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse JSON list: {}", json, e);
            return List.of();
        }
    }
}