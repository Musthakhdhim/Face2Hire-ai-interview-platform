package com.aiinterview.face2hire_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordDto {
    private String email;
    private String password;
    private String confirmPassword;

    public boolean isMatching(){
        return password.equals(confirmPassword);
    }
}
