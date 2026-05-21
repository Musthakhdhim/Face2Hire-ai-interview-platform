package com.aiinterview.face2hire_backend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ExperienceDto {
    private String company;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    private String description;
}