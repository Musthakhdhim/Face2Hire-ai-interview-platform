package com.aiinterview.face2hire_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequestDto {
    @NotBlank
    private String subject;

    @NotBlank
    private String body;

    @NotBlank
    private String recipientType;
}