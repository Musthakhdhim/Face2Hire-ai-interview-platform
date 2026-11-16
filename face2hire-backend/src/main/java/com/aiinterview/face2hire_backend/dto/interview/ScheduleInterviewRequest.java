package com.aiinterview.face2hire_backend.dto.interview;

import com.aiinterview.face2hire_backend.entity.interview.AvatarStyle;
import com.aiinterview.face2hire_backend.entity.interview.Difficulty;
import com.aiinterview.face2hire_backend.entity.interview.InterviewMode;
import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleInterviewRequest {
    @NotNull
    private Long intervieweeId;
    private String intervieweeName;
    @NotNull
    private InterviewType type;

    private InterviewMode interviewMode;

    private Difficulty difficulty;

    @NotNull
    private Integer duration;

    private Integer questionCount;

    private AvatarStyle avatarStyle;

    private LocalDate dueDate;

    private LocalDateTime scheduledAt;

    private Long applicationId;
    private Double minimumScore;

    private Long stageId;
    private Long applicationStageId;
}
