package com.aiinterview.face2hire_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResumeUploadRequest {
    @NotBlank
    private String fileName;
    @NotBlank
    private String fileType;
}