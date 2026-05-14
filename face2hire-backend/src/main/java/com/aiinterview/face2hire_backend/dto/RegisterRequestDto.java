package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.Role;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDto {

    @NotBlank(message = "Username should not be blank")
    @Size(min = 3, max = 50, message = "Username should be between 3 to 50 characters")
    @Pattern(
            regexp = "^[a-zA-Z0-9._-]+$",
            message = "Username can only contain letters, numbers, dots, underscores, and hyphens"
    )
    private String userName;

    @NotBlank(message = "Email should not be blank")
    @Email(message = "Please enter a valid email address")
    @Pattern(
            regexp = "^[A-Za-z0-9+_.-]+@(.+)$",
            message = "Please enter a valid email address"
    )
    private String email;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 8, max = 100, message = "Password must be between 8 to 100 characters")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@#$%^&+=!]).{8,}$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@#$%^&+=!)"
    )
    private String password;

    @NotBlank(message = "Confirm password cannot be blank")
    private String confirmPassword;

    @Enumerated(EnumType.STRING)
    private Role role;

    @AssertTrue(message = "You must accept terms and conditions to register")
    private boolean acceptTermsAndConditions;

    @AssertTrue(message = "Passwords do not match")
    public boolean isPasswordMatching() {

        if(password == null || confirmPassword == null){
            return false;
        }

        return password.equals(confirmPassword);
    }

    public void setAcceptTermsAndConditions(boolean acceptTermsAndConditions) {
        this.acceptTermsAndConditions = acceptTermsAndConditions;
    }
}