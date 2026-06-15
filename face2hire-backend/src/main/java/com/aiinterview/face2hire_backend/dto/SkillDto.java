package com.aiinterview.face2hire_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SkillDto {
    private String name;
    private Double years;
    private String level;
    private String category;
}
