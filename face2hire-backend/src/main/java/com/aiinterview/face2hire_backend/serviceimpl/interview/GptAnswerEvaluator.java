package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.FeedbackResponseDto;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.service.interview.AnswerEvaluator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GptAnswerEvaluator implements AnswerEvaluator {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.gpt.model}")
    private String model;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Override
    public FeedbackResponseDto evaluate(String questionText, String expectedKeywordsJson,
                                        String transcript, int responseDuration) {
        log.info("Evaluating answer for question: {}... (truncated)",
                questionText.substring(0, Math.min(50, questionText.length())));
        log.debug("Expected keywords: {}", expectedKeywordsJson);
        log.debug("Transcript: {}", transcript);

        String prompt = String.format("""
                Evaluate the candidate's answer to the interview question.
                Question: %s
                Expected keywords (JSON array): %s
                Candidate answer: %s
                Answer duration: %d seconds
                
                Return JSON with fields: score (0-100), feedbackText, strengths (string), improvements (string), suggestedAnswer,
                matchedKeywords (array), missingKeywords (array), grammarIssues (array).
                """, questionText, expectedKeywordsJson, transcript, responseDuration);

        log.debug("Sending prompt to OpenAI (length {} chars)", prompt.length());

        try {
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

            log.debug("OpenAI evaluation response: {}", response != null ? response.substring(0, Math.min(500, response.length())) : "null");

            String content = objectMapper.readTree(response)
                    .path("choices").get(0)
                    .path("message").path("content").asText();

            JsonNode root = objectMapper.readTree(content);
            FeedbackResponseDto result = FeedbackResponseDto.builder()
                    .score(root.has("score") ? root.get("score").asDouble() : 0.0)
                    .feedbackText(root.has("feedbackText") ? root.get("feedbackText").asText() : "")
                    .strengths(extractString(root, "strengths"))
                    .improvements(extractString(root, "improvements"))
                    .suggestedAnswer(root.has("suggestedAnswer") ? root.get("suggestedAnswer").asText() : "")
                    .keywordsMatched(extractList(root, "matchedKeywords"))
                    .keywordsMissing(extractList(root, "missingKeywords"))
                    .grammarIssues(extractList(root, "grammarIssues"))
                    .build();

            log.info("Evaluation completed with score: {}", result.getScore());
            return result;
        } catch (Exception e) {
            log.error("Failed to evaluate answer", e);
            throw new RuntimeException("Failed to parse evaluation response", e);
        }
    }

    private String extractString(JsonNode node, String field) {
        if (!node.has(field)) return "";
        JsonNode value = node.get(field);
        if (value.isArray()) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode item : value) {
                if (sb.length() > 0) sb.append("\n");
                sb.append(item.asText());
            }
            return sb.toString();
        } else {
            return value.asText();
        }
    }

    private List<String> extractList(JsonNode node, String field) {
        if (!node.has(field)) return List.of();
        JsonNode value = node.get(field);
        if (value.isArray()) {
            List<String> list = new ArrayList<>();
            for (JsonNode item : value) {
                list.add(item.asText());
            }
            return list;
        } else {
            return List.of(value.asText());
        }
    }
}