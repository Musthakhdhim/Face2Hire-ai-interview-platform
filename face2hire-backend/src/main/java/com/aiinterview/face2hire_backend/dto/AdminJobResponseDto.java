package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.JobStatus;
import com.aiinterview.face2hire_backend.entity.JobType;
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
public class AdminJobResponseDto {
    private Long id;
    private String title;
    private String company;
    private String location;
    private JobType type;
    private String salary;
    private Integer requiredExperience;
    private String description;
    private Long postedByUserId;
    private String postedByUserName;
    private String postedByUserEmail;
    private Integer applicantsCount;
    private JobStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> skills;
}