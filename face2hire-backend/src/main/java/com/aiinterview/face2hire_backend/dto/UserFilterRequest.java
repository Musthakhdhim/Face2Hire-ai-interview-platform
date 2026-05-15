package com.aiinterview.face2hire_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserFilterRequest {
    private String search;
    private String role;
    private Boolean isActive;
    private int page = 0;
    private int size = 10;
}
