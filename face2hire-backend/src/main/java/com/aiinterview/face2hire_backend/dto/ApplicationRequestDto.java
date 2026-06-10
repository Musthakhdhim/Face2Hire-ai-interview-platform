package com.aiinterview.face2hire_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApplicationRequestDto {
    @NotNull
    private Long jobId;

    @NotBlank
    private String coverLetter;
}