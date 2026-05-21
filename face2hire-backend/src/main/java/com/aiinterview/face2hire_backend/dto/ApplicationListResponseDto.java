package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.ApplicationStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationListResponseDto {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private Long userId;
    private String userName;
    private String userEmail;
    private Double score;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
}