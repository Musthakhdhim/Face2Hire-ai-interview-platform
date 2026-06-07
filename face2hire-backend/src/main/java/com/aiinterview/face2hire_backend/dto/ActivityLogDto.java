package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.ActivityAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userName;
    private ActivityAction action;
    private String description;
    private LocalDateTime createdAt;
}