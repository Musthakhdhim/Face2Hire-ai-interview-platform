package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.BadgeType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeDto {
    private Long id;
    @NotBlank
    private String name;
    private String description;
    private String iconUrl;
    private BadgeType type;
    private String requirement;
    private LocalDateTime createdAt;
}