package com.aiinterview.face2hire_backend.dto.interview;

import com.aiinterview.face2hire_backend.entity.interview.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledInterviewDto {
    private Long id;
    private Long intervieweeId;
    private String intervieweeName;
    private InterviewType type;
    private Difficulty difficulty;
    private Integer duration;
    private Integer questionCount;
    private AvatarStyle avatarStyle;
    private String scheduledByInterviewer;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private Long applicationId;
    private Double minimumScore;
    private Boolean completed;
}