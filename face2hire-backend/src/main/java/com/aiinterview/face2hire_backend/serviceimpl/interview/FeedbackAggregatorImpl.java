package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.OverallFeedbackDto;
import com.aiinterview.face2hire_backend.entity.interview.InterviewSession;
import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import com.aiinterview.face2hire_backend.entity.interview.QuestionFeedback;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.service.interview.FeedbackAggregator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
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
        try {
            InterviewSession session = sessionRepository.findById(sessionId).orElseThrow();
            String perQuestionSummary = feedbackList.stream()
                    .map(f -> String.format("Q: score %.2f, feedback: %s", f.getScore(), f.getFeedbackText()))
                    .collect(Collectors.joining("\n"));

            String scoreFields;
            switch (session.getType()) {
                case technical:
                    scoreFields = "overallScore (0-100), communicationScore, technicalScore, confidenceScore";
                    break;
                case hr:
                    scoreFields = "overallScore (0-100), communicationScore, confidenceScore, hrScore";
                    break;
                case behavioral:
                    scoreFields = "overallScore (0-100), communicationScore, confidenceScore, behavioralScore";
                    break;
                case salary:
                    scoreFields = "overallScore (0-100), communicationScore, confidenceScore, negotiationScore";
                    break;
                default:
                    scoreFields = "overallScore (0-100), communicationScore, confidenceScore";
            }

            String prompt = String.format("""
                    Based on the following per-question feedback for an interview, generate overall evaluation.
                    Interview type: %s, difficulty: %s
                    Question feedbacks:
                    %s
                    
                    Return JSON with these fields: %s,
                    strengths (string), improvements (string), detailedFeedback (string), suggestedResources (array of strings).
                    """, session.getType(), session.getDifficulty(), perQuestionSummary, scoreFields);

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

            String content = objectMapper.readTree(response).path("choices").get(0).path("message").path("content").asText();
            JsonNode root = objectMapper.readTree(content);

            double overall = root.has("overallScore") ? root.get("overallScore").asDouble() : 0.0;
            double communication = root.has("communicationScore") ? root.get("communicationScore").asDouble() : 0.0;
            double confidence = root.has("confidenceScore") ? root.get("confidenceScore").asDouble() : 0.0;
            double technical = 0.0;
            if (session.getType() == InterviewType.technical && root.has("technicalScore")) {
                technical = root.get("technicalScore").asDouble();
            } else if (session.getType() == InterviewType.hr && root.has("hrScore")) {
                technical = root.get("hrScore").asDouble();
            } else if (session.getType() == InterviewType.behavioral && root.has("behavioralScore")) {
                technical = root.get("behavioralScore").asDouble();
            } else if (session.getType() == InterviewType.salary && root.has("negotiationScore")) {
                technical = root.get("negotiationScore").asDouble();
            } else {
                technical = overall;
            }

            return OverallFeedbackDto.builder()
                    .overallScore(overall)
                    .communicationScore(communication)
                    .technicalScore(technical)
                    .confidenceScore(confidence)
                    .strengths(extractString(root, "strengths"))
                    .improvements(extractString(root, "improvements"))
                    .detailedFeedback(extractString(root, "detailedFeedback"))
                    .suggestedResources(extractList(root, "suggestedResources"))
                    .build();
        } catch (Exception e) {
            log.error("OpenAI aggregation failed, using computed average", e);
            double avgScore = feedbackList.stream().mapToDouble(QuestionFeedback::getScore).average().orElse(0.0);
            return OverallFeedbackDto.builder()
                    .overallScore(avgScore)
                    .communicationScore(avgScore)
                    .technicalScore(avgScore)
                    .confidenceScore(avgScore)
                    .strengths("You completed the interview. Review per‑question feedback for details.")
                    .improvements("Focus on areas where you scored low.")
                    .detailedFeedback(String.format("Your average score was %.1f%%.", avgScore))
                    .suggestedResources(List.of())
                    .build();
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
        }
        return value.asText();
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
        }
        return List.of(value.asText());
    }
}