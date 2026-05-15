package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.AdminStatsDto;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.UserGrowthDto;
import com.aiinterview.face2hire_backend.serviceimpl.AdminUserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminStatsController {

    private final AdminUserServiceImpl adminService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getStats() {
        ApiResponse<AdminStatsDto> response = adminService.getAdminStats();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user-growth")
    public ResponseEntity<ApiResponse<List<UserGrowthDto>>> getUserGrowth() {
        List<UserGrowthDto> growth = adminService.getUserGrowth();
        ApiResponse<List<UserGrowthDto>> response = ApiResponse.<List<UserGrowthDto>>builder()
                .success(true)
                .message("User growth retrieved")
                .data(growth)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}
