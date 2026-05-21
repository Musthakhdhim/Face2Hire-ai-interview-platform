package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.JobStatus;
import com.aiinterview.face2hire_backend.entity.JobType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class JobListResponseDto {
    private Long id;
    private String title;
    private String company;
    private String location;
    private JobType type;
    private String salary;
    private Integer requiredExperience;
    private Integer applicantsCount;
    private JobStatus status;
    private LocalDateTime createdAt;
    private List<String> skills;
    private Integer matchPercentage;
}