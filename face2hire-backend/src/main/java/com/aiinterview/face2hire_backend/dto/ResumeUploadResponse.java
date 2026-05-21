package com.aiinterview.face2hire_backend.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResumeUploadResponse {
    private String presignedUrl;
    private String fileKey;
}