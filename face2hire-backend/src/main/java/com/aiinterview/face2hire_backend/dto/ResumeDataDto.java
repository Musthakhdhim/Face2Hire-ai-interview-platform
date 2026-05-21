package com.aiinterview.face2hire_backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ResumeDataDto {
    private Long id;
    private String fileName;
    private String fileUrl;
    private LocalDateTime uploadedAt;
    private String status;
    private String extractedFullName;
    private String extractedEmail;
    private List<SkillInfoDto> skills;
    private List<ExperienceInfoDto> experiences;
}
