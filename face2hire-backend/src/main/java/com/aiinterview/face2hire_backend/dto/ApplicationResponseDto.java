package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
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

    private Integer currentStageOrder;
    private Integer totalStages;
    private String currentStageName;
    private Boolean isMultiRound;
    private String overallResult;
    private List<ApplicationStageDto> stages;
}