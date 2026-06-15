package com.aiinterview.face2hire_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ParsedResumeDto {
    private String fullName;
    private String email;
    private List<SkillDto> skills;
    private List<ExperienceDto> experiences;
}