package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.ApplicationStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationResponseDto {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private String company;
    private Long userId;
    private String userEmail;
    private String userName;
    private String coverLetter;
    private ApplicationStatus status;
    private Double score;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
}