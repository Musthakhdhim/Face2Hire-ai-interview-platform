package com.aiinterview.face2hire_backend.dto;


import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ExperienceInfoDto {
    private String company;
    private String title;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String description;
}