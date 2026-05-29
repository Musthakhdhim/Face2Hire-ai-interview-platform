package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.OverallFeedbackDto;
import com.aiinterview.face2hire_backend.entity.interview.InterviewSession;
import com.aiinterview.face2hire_backend.entity.interview.QuestionFeedback;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.service.interview.FeedbackAggregator;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackAggregatorImpl implements FeedbackAggregator {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final InterviewSessionRepository sessionRepository;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.gpt.model}")
    private String model;

    @Override
    public OverallFeedbackDto aggregate(Long sessionId, List<QuestionFeedback> feedbackList) {
        InterviewSession session = sessionRepository.findById(sessionId).orElseThrow();
        String perQuestionSummary = feedbackList.stream()
                .map(f -> String.format("Q: score %.2f, feedback: %s", f.getScore(), f.getFeedbackText()))
                .collect(Collectors.joining("\n"));

        String prompt = String.format("""
                Based on the following per-question feedback for an interview, generate overall evaluation.
                Interview type: %s, difficulty: %s
                Question feedbacks:
                %s
                
                Return JSON: overallScore (0-100), communicationScore, technicalScore, confidenceScore,
                strengths, improvements, detailedFeedback, suggestedResources (array of strings).
                """, session.getType(), session.getDifficulty(), perQuestionSummary);

        String response = webClient.post()
                .uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(Map.of(
                        "model", model,
                        "messages", List.of(Map.of("role", "user", "content", prompt)),
                        "temperature", 0.4,
                        "response_format", Map.of("type", "json_object")
                ))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            String content = objectMapper.readTree(response).path("choices").get(0).path("message").path("content").asText();
            return objectMapper.readValue(content, OverallFeedbackDto.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate overall feedback", e);
        }
    }
}