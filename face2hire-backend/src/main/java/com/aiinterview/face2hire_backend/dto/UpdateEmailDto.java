package com.aiinterview.face2hire_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmailDto {
    @Email(message = "enter a valid email")
    @NotBlank(message = "email should not be blank")
    private String email;
}
