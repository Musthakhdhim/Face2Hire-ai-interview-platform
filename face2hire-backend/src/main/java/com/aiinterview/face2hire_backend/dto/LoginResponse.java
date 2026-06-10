package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {

    private Long id;
    private String userName;
    private String email;
    private Role role;
    private String jwt;
    private String refreshToken;

}
