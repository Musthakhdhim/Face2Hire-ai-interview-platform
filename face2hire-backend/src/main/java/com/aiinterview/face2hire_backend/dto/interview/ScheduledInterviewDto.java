package com.aiinterview.face2hire_backend.dto.interview;

import com.aiinterview.face2hire_backend.entity.interview.AvatarStyle;
import com.aiinterview.face2hire_backend.entity.interview.Difficulty;
import com.aiinterview.face2hire_backend.entity.interview.InterviewMode;
import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
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
    private String intervieweeEmail;
    private InterviewType type;
    private InterviewMode interviewMode;
    private Difficulty difficulty;
    private Integer duration;
    private Integer questionCount;
    private AvatarStyle avatarStyle;
    private String scheduledByInterviewer;
    private String interviewerName;
    private LocalDateTime dueDate;
    private LocalDateTime scheduledAt;
    private String meetingId;
    private String meetingJoinUrl;
    private String meetingStartUrl;
    private String meetingPasscode;
    private Boolean callEnded;
    private LocalDateTime createdAt;
    private Long applicationId;
    private Double minimumScore;
    private Boolean completed;
    private Long stageId;
    private Long applicationStageId;
}