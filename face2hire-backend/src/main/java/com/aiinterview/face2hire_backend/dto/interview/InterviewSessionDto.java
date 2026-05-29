package com.aiinterview.face2hire_backend.dto.interview;

import com.aiinterview.face2hire_backend.entity.interview.*;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class InterviewSessionDto {
    private Long id;
    private InterviewType type;
    private Difficulty difficulty;
    private Integer duration;
    private Integer questionCount;
    private AvatarStyle avatarStyle;
    private SessionStatus status;
    private Double overallScore;
    private Double communicationScore;
    private Double technicalScore;
    private Double confidenceScore;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private Long scheduledInterviewId;
}