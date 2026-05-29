package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.entity.Experience;
import com.aiinterview.face2hire_backend.entity.Resume;
import com.aiinterview.face2hire_backend.entity.ResumeStatus;
import com.aiinterview.face2hire_backend.entity.Skill;
import com.aiinterview.face2hire_backend.entity.interview.Difficulty;
import com.aiinterview.face2hire_backend.entity.interview.InterviewQuestion;
import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import com.aiinterview.face2hire_backend.repository.ExperienceRepository;
import com.aiinterview.face2hire_backend.repository.ResumeRepository;
import com.aiinterview.face2hire_backend.repository.SkillRepository;
import com.aiinterview.face2hire_backend.repository.interview.InterviewQuestionRepository;
import com.aiinterview.face2hire_backend.service.interview.QuestionGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OpenAiQuestionGenerator implements QuestionGenerator {

    private final ResumeRepository resumeRepository;
    private final SkillRepository skillRepository;
    private final ExperienceRepository experienceRepository;
    private final InterviewQuestionRepository questionRepository;
    private final ObjectMapper objectMapper;
    private final WebClient webClient;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.gpt.model}")
    private String model;

    @Override
    public List<InterviewQuestion> generateQuestions(Long sessionId, Long userId,
                                                     InterviewType type, Difficulty difficulty,
                                                     int questionCount) throws JsonProcessingException {
        // Fetch user's resume skills and experience
        Resume activeResume = resumeRepository.findByUserIdAndIsActiveTrue(userId);
        if (activeResume == null || activeResume.getStatus() != ResumeStatus.COMPLETED) {
            throw new RuntimeException("No completed resume found for user");
        }
        List<Skill> skills = skillRepository.findByResumeId(activeResume.getId());
        List<Experience> experiences = experienceRepository.findByResumeId(activeResume.getId());

        String skillNames = skills.stream().map(Skill::getSkillName).collect(Collectors.joining(", "));
        String expSummary = experiences.stream()
                .map(e -> e.getJobTitle() + " at " + e.getCompanyName())
                .collect(Collectors.joining("; "));

        String prompt = String.format("""
                You are an expert interviewer. Generate %d %s interview questions at %s difficulty for a candidate with the following profile:
                Skills: %s
                Experience: %s
                
                Return a JSON array of objects with fields: "questionText", "category", "expectedKeywords" (array of strings).
                Example: [{"questionText": "Explain dependency injection in Spring", "category": "Spring", "expectedKeywords": ["dependency injection", "IoC", "Spring"]}]
                Only return valid JSON, no extra text.
                """, questionCount, type, difficulty, skillNames, expSummary);

        String response = webClient.post()
                .uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(Map.of(
                        "model", model,
                        "messages", List.of(Map.of("role", "user", "content", prompt)),
                        "temperature", 0.7
                ))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // Parse JSON response
        List<Map<String, Object>> generated;
        try {
            String content = objectMapper.readTree(response).path("choices").get(0).path("message").path("content").asText();
            generated = objectMapper.readValue(content, new TypeReference<>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse OpenAI response", e);
        }

        List<InterviewQuestion> questions = new ArrayList<>();
        int index = 1;
        for (Map<String, Object> q : generated) {
            String questionText = (String) q.get("questionText");
            String category = (String) q.get("category");
            Object keywordsObj = q.get("expectedKeywords");
            String keywordsJson = objectMapper.writeValueAsString(keywordsObj);

            InterviewQuestion question = InterviewQuestion.builder()
                    .sessionId(sessionId)
                    .questionIndex(index++)
                    .questionText(questionText)
                    .category(category)
                    .expectedKeywords(keywordsJson)
                    .build();
            questions.add(question);
        }
        return questionRepository.saveAll(questions);
    }
}