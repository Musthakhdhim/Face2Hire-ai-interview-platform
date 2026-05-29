package com.aiinterview.face2hire_backend.dto.interview;

import com.aiinterview.face2hire_backend.entity.interview.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ScheduleInterviewRequest {
    @NotNull
    private Long intervieweeId;
    private String intervieweeName;
    @NotNull
    private InterviewType type;
    @NotNull
    private Difficulty difficulty;
    @NotNull
    private Integer duration;
    @NotNull
    private Integer questionCount;
    @NotNull
    private AvatarStyle avatarStyle;
    @NotNull
    private LocalDate dueDate;
}
