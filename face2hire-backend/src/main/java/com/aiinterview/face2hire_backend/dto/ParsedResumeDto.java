package com.aiinterview.face2hire_backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class ParsedResumeDto {
    private String fullName;
    private String email;
    private List<SkillDto> skills;
    private List<ExperienceDto> experiences;
}