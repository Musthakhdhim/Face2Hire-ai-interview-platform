package com.aiinterview.face2hire_backend.dto.interview;

import com.aiinterview.face2hire_backend.entity.interview.AvatarStyle;
import com.aiinterview.face2hire_backend.entity.interview.Difficulty;
import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartSessionRequest {
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
    private Long scheduledInterviewId;
}