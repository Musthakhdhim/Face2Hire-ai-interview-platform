package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.FeedbackResponseDto;
import com.aiinterview.face2hire_backend.service.interview.AnswerEvaluator;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GptAnswerEvaluator implements AnswerEvaluator {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.gpt.model}")
    private String model;

    @Override
    public FeedbackResponseDto evaluate(String questionText, String expectedKeywordsJson,
                                        String transcript, int responseDuration) {
        String prompt = String.format("""
                Evaluate the candidate's answer to the interview question.
                Question: %s
                Expected keywords (JSON array): %s
                Candidate answer: %s
                Answer duration: %d seconds
                
                Return JSON with fields: score (0-100), feedbackText, strengths, improvements, suggestedAnswer,
                matchedKeywords (array), missingKeywords (array), grammarIssues (array).
                """, questionText, expectedKeywordsJson, transcript, responseDuration);

        String response = webClient.post()
                .uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(Map.of(
                        "model", model,
                        "messages", List.of(Map.of("role", "user", "content", prompt)),
                        "temperature", 0.3,
                        "response_format", Map.of("type", "json_object")
                ))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            String content = objectMapper.readTree(response).path("choices").get(0).path("message").path("content").asText();
            return objectMapper.readValue(content, FeedbackResponseDto.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse evaluation response", e);
        }
    }
}
