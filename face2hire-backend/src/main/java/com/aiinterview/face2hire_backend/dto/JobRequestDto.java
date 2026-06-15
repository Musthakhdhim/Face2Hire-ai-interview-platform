package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.JobType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobRequestDto {
    @NotBlank
    private String title;

    @NotBlank
    private String company;

    private String location;

    @NotNull
    private JobType type;

    private String salary;

    private Integer requiredExperience;

    @NotBlank
    private String description;

    private List<String> skills;
}
