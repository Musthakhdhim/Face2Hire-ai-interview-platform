package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.ParsedResumeDto;
import com.aiinterview.face2hire_backend.entity.*;
import com.aiinterview.face2hire_backend.exception.ValidationException;
import com.aiinterview.face2hire_backend.repository.*;
import com.aiinterview.face2hire_backend.service.OpenAiParserService;
import com.aiinterview.face2hire_backend.service.S3Service;
import com.aiinterview.face2hire_backend.service.TextExtractionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumeProcessingService {

    private final S3Service s3Service;
    private final TextExtractionService textExtractionService;
    private final OpenAiParserService openAiParserService;
    private final ResumeRepository resumeRepository;
    private final SkillRepository skillRepository;
    private final ExperienceRepository experienceRepository;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Transactional
    public Resume processUpload(Long userId, String fileKey, String fileName, String userFullName) {
        resumeRepository.deactivateAllActiveResumesForUser(userId);

        int nextVersion = resumeRepository.findMaxVersionByUserId(userId).orElse(0) + 1;

        Resume resume = Resume.builder()
                .userId(userId)
                .fileKey(fileKey)
                .status(ResumeStatus.PROCESSING)
                .uploadedAt(LocalDateTime.now())
                .isActive(true)
                .versionNumber(nextVersion)
                .build();
        resume = resumeRepository.save(resume);

        try {
            byte[] fileData = s3Service.downloadFile(fileKey);
            String extractedText = textExtractionService.extractText(fileData, fileName);
            ParsedResumeDto parsed = openAiParserService.parseResume(extractedText);
            System.out.println("hello");

            if (parsed.getFullName() != null && !parsed.getFullName().trim().equalsIgnoreCase(userFullName)) {
                System.out.println("inside error");
                throw new ValidationException("CV name does not match your profile name");
            }
            System.out.println("second ghello");

            String jsonResponse = objectMapper.writeValueAsString(parsed);
            resume.setParsedContent(jsonResponse);
            resume.setExtractedFullName(parsed.getFullName());
            resume.setExtractedEmail(parsed.getEmail());

            Long resumeId = resume.getId();

            if (parsed.getSkills() != null && !parsed.getSkills().isEmpty()) {
                skillRepository.saveAll(parsed.getSkills().stream()
                        .map(s -> Skill.builder()
                                .resumeId(resumeId)
                                .skillName(s.getName())
                                .yearsOfExperience(s.getYears())
                                .proficiencyLevel(s.getLevel() != null
                                        ? ProficiencyLevel.valueOf(s.getLevel().toUpperCase())
                                        : ProficiencyLevel.BEGINNER)
                                .category(s.getCategory())
                                .build())
                        .collect(Collectors.toList()));
            }

            if (parsed.getExperiences() != null && !parsed.getExperiences().isEmpty()) {
                experienceRepository.saveAll(parsed.getExperiences().stream()
                        .map(e -> Experience.builder()
                                .resumeId(resumeId)
                                .companyName(e.getCompany())
                                .jobTitle(e.getTitle())
                                .startDate(e.getStartDate())
                                .endDate(e.getEndDate())
                                .description(e.getDescription())
                                .build())
                        .collect(Collectors.toList()));
            }

            resume.setStatus(ResumeStatus.COMPLETED);
            return resumeRepository.save(resume);

        } catch (Exception e) {
            resume.setStatus(ResumeStatus.FAILED);
            resume.setParsedContent("Error: " + e.getMessage());
            return resumeRepository.save(resume);
        }
    }
}


//package com.aiinterview.face2hire_backend.serviceimpl;
//
//import com.aiinterview.face2hire_backend.dto.ParsedResumeDto;
//import com.aiinterview.face2hire_backend.entity.*;
//import com.aiinterview.face2hire_backend.repository.*;
//import com.aiinterview.face2hire_backend.service.OpenAiParserService;
//import com.aiinterview.face2hire_backend.service.S3Service;
//import com.aiinterview.face2hire_backend.service.TextExtractionService;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDateTime;
//import java.util.stream.Collectors;
//
//@Service
//@RequiredArgsConstructor
//public class ResumeProcessingService {
//
//    private final S3Service s3Service;
//    private final TextExtractionService textExtractionService;
//    private final OpenAiParserService openAiParserService;
//    private final ResumeRepository resumeRepository;
//    private final SkillRepository skillRepository;
//    private final ExperienceRepository experienceRepository;
//    private final ObjectMapper objectMapper = new ObjectMapper()
//            .registerModule(new JavaTimeModule());
//    @Transactional
//    public Resume processUpload(Long userId, String fileKey, String fileName, String userFullName) {
//        Resume resume = Resume.builder()
//                .userId(userId)
//                .fileKey(fileKey)
//                .status(ResumeStatus.PROCESSING)
//                .uploadedAt(LocalDateTime.now())
//                .isActive(true)
//                .versionNumber(1)
//                .build();
//        resume = resumeRepository.save(resume);
//
//        try {
//            byte[] fileData = s3Service.downloadFile(fileKey);
//            String extractedText = textExtractionService.extractText(fileData, fileName);
//
//            ParsedResumeDto parsed = openAiParserService.parseResume(extractedText);
//
//            if (parsed.getFullName() != null && !parsed.getFullName().trim().equalsIgnoreCase(userFullName)) {
//                throw new RuntimeException("CV name does not match your profile name");
//            }
//
//            String jsonResponse = objectMapper.writeValueAsString(parsed);
//            resume.setParsedContent(jsonResponse);
//
//            resume.setExtractedFullName(parsed.getFullName());
//            resume.setExtractedEmail(parsed.getEmail());
//
//            Long resumeId = resume.getId();
//            if (parsed.getSkills() != null) {
//                skillRepository.saveAll(parsed.getSkills().stream()
//                        .map(s -> Skill.builder()
//                                .resumeId(resumeId)
//                                .skillName(s.getName())
//                                .yearsOfExperience(s.getYears())
//                                .proficiencyLevel(s.getLevel() != null
//                                        ? ProficiencyLevel.valueOf(s.getLevel().toUpperCase())
//                                        : ProficiencyLevel.BEGINNER)
//                                .category(s.getCategory())
//                                .build())
//                        .collect(Collectors.toList()));
//            }
//
//            if (parsed.getExperiences() != null) {
//                experienceRepository.saveAll(parsed.getExperiences().stream()
//                        .map(e -> Experience.builder()
//                                .resumeId(resumeId)
//                                .companyName(e.getCompany())
//                                .jobTitle(e.getTitle())
//                                .startDate(e.getStartDate())
//                                .endDate(e.getEndDate())
//                                .description(e.getDescription())
//                                .build())
//                        .collect(Collectors.toList()));
//            }
//
//            resume.setStatus(ResumeStatus.COMPLETED);
//            return resumeRepository.save(resume);
//        } catch (Exception e) {
//            resume.setStatus(ResumeStatus.FAILED);
//            resume.setParsedContent("Error: " + e.getMessage());
//            return resumeRepository.save(resume);
//        }
//    }
//}