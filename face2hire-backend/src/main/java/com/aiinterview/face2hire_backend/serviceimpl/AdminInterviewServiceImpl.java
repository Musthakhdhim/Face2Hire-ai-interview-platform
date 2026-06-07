package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.AdminInterviewDetailResponseDto;
import com.aiinterview.face2hire_backend.dto.AdminInterviewFilterRequest;
import com.aiinterview.face2hire_backend.dto.AdminInterviewResponseDto;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.entity.interview.InterviewQuestion;
import com.aiinterview.face2hire_backend.entity.interview.InterviewSession;
import com.aiinterview.face2hire_backend.entity.interview.QuestionFeedback;
import com.aiinterview.face2hire_backend.entity.interview.UserResponse;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.repository.interview.InterviewQuestionRepository;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.repository.interview.QuestionFeedbackRepository;
import com.aiinterview.face2hire_backend.repository.interview.UserResponseRepository;
import com.aiinterview.face2hire_backend.service.AdminInterviewService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminInterviewServiceImpl implements AdminInterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final InterviewQuestionRepository questionRepository;
    private final UserResponseRepository userResponseRepository;
    private final QuestionFeedbackRepository questionFeedbackRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminInterviewResponseDto> getAllInterviews(AdminInterviewFilterRequest filter) {
        log.info("Fetching interviews with filters: {}", filter);

        int page = filter.getPage() != null ? filter.getPage() : 0;
        int size = filter.getSize() != null ? filter.getSize() : 20;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        LocalDateTime fromDateTime = filter.getFromDate() != null
                ? filter.getFromDate().atStartOfDay()
                : null;
        LocalDateTime toDateTime = filter.getToDate() != null
                ? filter.getToDate().atTime(LocalTime.MAX)
                : null;

        Page<InterviewSession> sessions = sessionRepository.findAllWithFilters(
                filter.getSearch(),
                filter.getType(),
                filter.getStatus(),
                fromDateTime,
                toDateTime,
                pageable
        );

        return sessions.map(this::convertToDto);
    }

    private AdminInterviewResponseDto convertToDto(InterviewSession session) {
        String userName = null;
        String userEmail = null;
        Optional<User> userOpt = userRepository.findById(session.getUserId());
        if (userOpt.isPresent()) {
            userName = userOpt.get().getFullName();
            userEmail = userOpt.get().getEmail();
        }

        return AdminInterviewResponseDto.builder()
                .id(session.getId())
                .userId(session.getUserId())
                .userName(userName)
                .userEmail(userEmail)
                .type(session.getType())
                .difficulty(session.getDifficulty())
                .duration(session.getDuration())
                .questionCount(session.getQuestionCount())
                .status(session.getStatus())
                .overallScore(session.getOverallScore())
                .communicationScore(session.getCommunicationScore())
                .technicalScore(session.getTechnicalScore())
                .confidenceScore(session.getConfidenceScore())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .createdAt(session.getCreatedAt())
                .isScheduled(session.getIsScheduled())
                .scheduledInterviewId(session.getScheduledInterviewId())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminInterviewDetailResponseDto getInterviewDetail(Long interviewId) {
        InterviewSession session = sessionRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found: " + interviewId));

        String userName = null;
        String userEmail = null;
        Optional<User> userOpt = userRepository.findById(session.getUserId());
        if (userOpt.isPresent()) {
            userName = userOpt.get().getFullName();
            userEmail = userOpt.get().getEmail();
        }

        List<InterviewQuestion> questions = questionRepository.findBySessionIdOrderByQuestionIndexAsc(session.getId());

        List<AdminInterviewDetailResponseDto.QuestionDetail> questionDetails = new ArrayList<>();
        for (InterviewQuestion q : questions) {
            Optional<UserResponse> responseOpt = userResponseRepository.findByQuestionId(q.getId());
            UserResponse response = responseOpt.orElse(null);

            QuestionFeedback feedback = null;
            if (response != null) {
                Optional<QuestionFeedback> fbOpt = questionFeedbackRepository.findByUserResponseId(response.getId());
                feedback = fbOpt.orElse(null);
            }

            List<String> expectedKeywords = parseJsonList(q.getExpectedKeywords());
            List<String> keywordsMatched = response != null ? parseJsonList(response.getKeywordsMatched()) : null;
            List<String> keywordsMissing = response != null ? parseJsonList(response.getKeywordsMissing()) : null;
            List<String> grammarIssues = response != null ? parseJsonList(response.getGrammarIssues()) : null;

            AdminInterviewDetailResponseDto.QuestionDetail qd = AdminInterviewDetailResponseDto.QuestionDetail.builder()
                    .questionId(q.getId())
                    .questionIndex(q.getQuestionIndex())
                    .questionText(q.getQuestionText())
                    .category(q.getCategory())
                    .expectedKeywords(expectedKeywords)
                    .responseId(response != null ? response.getId() : null)
                    .audioUrl(response != null ? response.getAudioUrl() : null)
                    .transcribedText(response != null ? response.getTranscribedText() : null)
                    .responseDuration(response != null ? response.getResponseDuration() : null)
                    .confidenceScore(response != null ? response.getConfidenceScore() : null)
                    .speakingRateWpm(response != null ? response.getSpeakingRateWpm() : null)
                    .fillerWordCount(response != null ? response.getFillerWordCount() : null)
                    .sentimentScore(response != null ? response.getSentimentScore() : null)
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

        return AdminInterviewDetailResponseDto.builder()
                .id(session.getId())
                .userId(session.getUserId())
                .userName(userName)
                .userEmail(userEmail)
                .type(session.getType())
                .difficulty(session.getDifficulty())
                .duration(session.getDuration())
                .questionCount(session.getQuestionCount())
                .status(session.getStatus())
                .overallScore(session.getOverallScore())
                .communicationScore(session.getCommunicationScore())
                .technicalScore(session.getTechnicalScore())
                .confidenceScore(session.getConfidenceScore())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .createdAt(session.getCreatedAt())
                .isScheduled(session.getIsScheduled())
                .scheduledInterviewId(session.getScheduledInterviewId())
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