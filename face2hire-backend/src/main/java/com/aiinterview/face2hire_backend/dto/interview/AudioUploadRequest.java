package com.aiinterview.face2hire_backend.dto.interview;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AudioUploadRequest {
    @NotBlank private String fileName;
    @NotBlank private String fileType;
}
