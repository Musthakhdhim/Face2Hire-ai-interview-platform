package com.aiinterview.face2hire_backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SkillInfoDto {
    private String name;
    private Double years;
    private String level;
    private String category;
}