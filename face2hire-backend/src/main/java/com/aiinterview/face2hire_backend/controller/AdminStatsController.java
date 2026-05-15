package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.AdminStatsDto;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.UserGrowthDto;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.serviceimpl.AdminUserServiceImpl;
import jakarta.annotation.PostConstruct;
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
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsDto>> getStats() {
        log.info("Received request for admin statistics");
        ApiResponse<AdminStatsDto> response = adminService.getAdminStats();
        AdminStatsDto stats = response.getData();
        log.info("Statistics retrieved: totalUsers={}, activeUsers={}, totalInterviews={}, premiumUsers={}",
                stats.getTotalUsers(), stats.getActiveUsers(), stats.getTotalInterviews(), stats.getPremiumUsers());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user-growth")
    public ResponseEntity<ApiResponse<List<UserGrowthDto>>> getUserGrowth() {
        log.info("Received request for user growth data");
        List<UserGrowthDto> growth = adminService.getUserGrowth();
        log.info("User growth retrieved: {} data points", growth.size());
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