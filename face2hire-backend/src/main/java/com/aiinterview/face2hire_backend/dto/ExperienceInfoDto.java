package com.aiinterview.face2hire_backend.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExperienceInfoDto {
    private String company;
    private String title;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String description;
}