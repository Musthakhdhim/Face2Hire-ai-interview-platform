package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import com.aiinterview.face2hire_backend.entity.interview.Difficulty;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminInterviewResponseDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private InterviewType type;
    private Difficulty difficulty;
    private Integer duration;
    private Integer questionCount;
    private SessionStatus status;
    private Double overallScore;
    private Double communicationScore;
    private Double technicalScore;
    private Double confidenceScore;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private Boolean isScheduled;
    private Long scheduledInterviewId;
}