package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.entity.Experience;
import com.aiinterview.face2hire_backend.entity.Resume;
import com.aiinterview.face2hire_backend.entity.ResumeStatus;
import com.aiinterview.face2hire_backend.entity.Skill;
import com.aiinterview.face2hire_backend.entity.interview.Difficulty;
import com.aiinterview.face2hire_backend.entity.interview.InterviewQuestion;
import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.ExperienceRepository;
import com.aiinterview.face2hire_backend.repository.ResumeRepository;
import com.aiinterview.face2hire_backend.repository.SkillRepository;
import com.aiinterview.face2hire_backend.repository.interview.InterviewQuestionRepository;
import com.aiinterview.face2hire_backend.service.interview.QuestionGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
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
    public List<InterviewQuestion> generateQuestions(Long sessionId, Long userId,
                                                     InterviewType type, Difficulty difficulty,
                                                     int questionCount) throws JsonProcessingException {
        log.info("Generating {} {} questions for session {}, user {}, difficulty {}",
                questionCount, type, sessionId, userId, difficulty);

        Resume activeResume = resumeRepository.findByUserIdAndIsActiveTrue(userId);
        if (activeResume == null || activeResume.getStatus() != ResumeStatus.COMPLETED) {
            log.error("No completed resume found for user {}", userId);
            throw new RuntimeException("No completed resume found for user");
        }
        log.debug("Resume found for user {}, id={}", userId, activeResume.getId());

        List<Skill> skills = skillRepository.findByResumeId(activeResume.getId());
        List<Experience> experiences = experienceRepository.findByResumeId(activeResume.getId());
        log.debug("Found {} skills and {} experiences", skills.size(), experiences.size());

        String skillNames = skills.stream().map(Skill::getSkillName).collect(Collectors.joining(", "));
        String expSummary = experiences.stream()
                .map(e -> e.getJobTitle() + " at " + e.getCompanyName())
                .collect(Collectors.joining("; "));

        String prompt;
        switch (type) {
            case technical:
                prompt = String.format("""
                    You are an expert technical interviewer. Generate %d technical interview questions at %s difficulty for a candidate with the following technical skills and experience:
                    Skills: %s
                    Experience: %s
                    
                    Return a JSON array of objects with fields: "questionText", "category", "expectedKeywords" (array of strings).
                    Example: [{"questionText": "Explain dependency injection in Spring", "category": "Spring", "expectedKeywords": ["dependency injection", "IoC", "Spring"]}]
                    Only return valid JSON, no extra text.
                    """, questionCount, difficulty, skillNames, expSummary);
                break;
            case hr:
                prompt = String.format("""
                    You are an expert HR interviewer. Generate %d HR interview questions at %s difficulty for a candidate with the following background:
                    Skills: %s
                    Experience: %s
                    Focus on behavioral questions, cultural fit, teamwork, conflict resolution, motivation, and career goals.
                    
                    Return a JSON array of objects with fields: "questionText", "category", "expectedKeywords" (array of strings).
                    Example: [{"questionText": "Describe a time you had a conflict with a coworker and how you resolved it.", "category": "Conflict Resolution", "expectedKeywords": ["conflict", "resolution", "teamwork"]}]
                    Only return valid JSON, no extra text.
                    """, questionCount, difficulty, skillNames, expSummary);
                break;
            case behavioral:
                prompt = String.format("""
                    You are an expert behavioral interviewer. Generate %d behavioral interview questions at %s difficulty for a candidate with the following profile:
                    Skills: %s
                    Experience: %s
                    Use the STAR method (Situation, Task, Action, Result) to assess past behavior.
                    
                    Return a JSON array of objects with fields: "questionText", "category", "expectedKeywords" (array of strings).
                    Example: [{"questionText": "Tell me about a time you led a project to success.", "category": "Leadership", "expectedKeywords": ["leadership", "project", "success"]}]
                    Only return valid JSON, no extra text.
                    """, questionCount, difficulty, skillNames, expSummary);
                break;
            case salary:
                prompt = String.format("""
                    You are an expert compensation interviewer. Generate %d salary negotiation interview questions at %s difficulty for a candidate with the following profile:
                    Skills: %s
                    Experience: %s
                    Focus on salary expectations, compensation packages, benefits, and negotiation strategies.
                    
                    Return a JSON array of objects with fields: "questionText", "category", "expectedKeywords" (array of strings).
                    Example: [{"questionText": "What are your salary expectations for this role?", "category": "Salary Expectations", "expectedKeywords": ["salary", "expectations", "compensation"]}]
                    Only return valid JSON, no extra text.
                    """, questionCount, difficulty, skillNames, expSummary);
                break;
            default:
                throw new IllegalArgumentException("Unsupported interview type: " + type);
        }

        log.debug("Sending prompt to OpenAI (length {} chars)", prompt.length());

        try {
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

            log.debug("OpenAI raw response: {}", response != null ? response.substring(0, Math.min(500, response.length())) : "null");

            String content = objectMapper.readTree(response).path("choices").get(0).path("message").path("content").asText();
            log.debug("Raw content before cleaning: {}", content);

            content = content.replaceAll("```json\\n?|```", "").trim();
            log.debug("Cleaned content: {}", content);

            List<Map<String, Object>> generated = objectMapper.readValue(content, new TypeReference<>() {});

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
            log.info("Successfully generated {} questions", questions.size());
            return questionRepository.saveAll(questions);
        } catch (Exception e) {
            log.error("Failed to generate questions from OpenAI", e);
            throw new RuntimeException("Failed to parse OpenAI response", e);
        }
    }
}