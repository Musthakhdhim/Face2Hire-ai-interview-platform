package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailResponseDto {
    private Long id;
    private String userName;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String profileImageUrl;
    private Role role;
    private boolean isActive;
    private boolean isVerified;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    private ResumeInfo resume;

    private InterviewStats interviewStats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumeInfo {
        private Long resumeId;
        private String fileName;
        private String fileUrl;
        private LocalDateTime uploadedAt;
        private String status;
        private String extractedFullName;
        private String extractedEmail;
        private List<SkillInfo> skills;
        private List<ExperienceInfo> experiences;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillInfo {
        private String name;
        private Double yearsOfExperience;
        private String proficiencyLevel;
        private String category;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperienceInfo {
        private String companyName;
        private String jobTitle;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewStats {
        private long totalCompletedInterviews;
        private Double avgOverallScore;
        private Double avgCommunicationScore;
        private Double avgTechnicalScore;
        private Double avgConfidenceScore;
    }
}
