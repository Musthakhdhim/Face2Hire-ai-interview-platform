package com.aiinterview.face2hire_backend.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AudioConfirmRequest {
    private String fileKey;
}
