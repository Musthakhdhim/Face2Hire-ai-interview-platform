package com.aiinterview.face2hire_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResumeUploadRequest {
    @NotBlank
    private String fileName;
    @NotBlank
    private String fileType;
}