package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.ParsedResumeDto;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.service.OpenAiParserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OpenAiParserServiceImpl implements OpenAiParserService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model:gpt-3.5-turbo}")
    private String model;

    private WebClient webClient;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1/chat/completions")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Override
    public ParsedResumeDto parseResume(String extractedText) {
        log.info("Starting OpenAI parsing, text length: {} chars", extractedText.length());

        String prompt = """
            You are a CV parser. Extract the following information from the CV text below.
            Return ONLY valid JSON with the exact structure. Use empty arrays for missing fields.
            
            {
              "fullName": "string",
              "email": "string",
              "skills": [
                { "name": "string", "years": number or null, "level": "BEGINNER|INTERMEDIATE|EXPERT" or null, "category": "string" or null }
              ],
              "experiences": [
                { "company": "string", "title": "string", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD or null", "description": "string" }
              ]
            }
            
            SKILLS EXTRACTION:
            Parse ALL skills from these categories:
            1. Primary Skills / Core Skills
            2. Programming Languages (Java, Python, etc.)
            3. Frameworks (Spring Boot, Angular, React, etc.)
            4. Web Technologies (HTML, CSS, JavaScript, etc.)
            5. Databases (PostgreSQL, MySQL, MongoDB, etc.)
            6. Tools & Platforms (ServiceNow, Control-M, etc.)
            7. Design Patterns (Builder, Facade, etc.)
            8. Legacy Systems (Mainframe, Telnet, etc.)
            9. Other Technical Skills
            
            Extract each skill individually. For compound skills like "Java Full Stack":
            - Extract "Java" as a skill
            - Extract "Full Stack Development" as a skill
            - Also extract "Spring Boot", "Angular" from the context
            
            For the CV provided, look for:
            - "Primary Skills: Java, PostgreSQL" → Java and PostgreSQL
            - "Web Technologies: Java Full Stack, Angular, Spring Boot, HTML, CSS" → Java, Full Stack, Angular, Spring Boot, HTML, CSS
            - "Database & Tools: SQL, OOPS, Prompt Engineering" → SQL, OOPS, Prompt Engineering
            - "Legacy Systems: Mainframe, Telnet Applications" → Mainframe, Telnet
            - "Design Patterns: Builder, Facade, Template, Memento, and Command" → Builder, Facade, Template, Memento, Command
            - "Support Tools: ServiceNow, Control-M, Microsoft Applications" → ServiceNow, Control-M, Microsoft Applications
            
            Rules for dates:
            - Convert "MM/YYYY" to first day of that month: "YYYY-MM-01"
            - If only year is given, use "YYYY-01-01"
            - "Current" or "Present" → null
            
            CV text:
        """ + extractedText;

        if (prompt.length() > 8000) {
            prompt = prompt.substring(0, 8000);
            log.warn("Prompt truncated to 8000 chars");
        }

        try {
            log.debug("Sending request to OpenAI API");

            String response = webClient.post()
                    .bodyValue(Map.of(
                            "model", model,
                            "messages", List.of(Map.of("role", "user", "content", prompt)),
                            "temperature", 0.2,
                            "max_tokens", 2500
                    ))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            if (response == null) {
                throw new RuntimeException("Empty response from OpenAI");
            }

            JsonNode root = objectMapper.readTree(response);
            if (root.has("error")) {
                String errorMsg = root.path("error").path("message").asText();
                log.error("OpenAI API error: {}", errorMsg);
                throw new RuntimeException("OpenAI error: " + errorMsg);
            }

            String content = root.path("choices").get(0).path("message").path("content").asText();
            content = content.replaceAll("```json\\n?|```", "").trim();
            log.info("Parsed content: {}", content.length() > 200 ? content.substring(0, 200) + "..." : content);

            ParsedResumeDto parsed = objectMapper.readValue(content, ParsedResumeDto.class);
            log.info("OpenAI parsing successful. Full name: {}, skills count: {}",
                    parsed.getFullName(),
                    parsed.getSkills() != null ? parsed.getSkills().size() : 0);

            return parsed;
        } catch (Exception e) {
            log.error("OpenAI parsing failed", e);
            throw new RuntimeException("OpenAI parsing failed: " + e.getMessage(), e);
        }
    }
}