package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.AdminReportsDto;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.service.AdminReportsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportsController {

    private final AdminReportsService adminReportsService;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminReportsDto>> getReports(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("Admin fetching reports from {} to {}", startDate, endDate);
        AdminReportsDto reports = adminReportsService.getReports(startDate, endDate);
        ApiResponse<AdminReportsDto> response = ApiResponse.<AdminReportsDto>builder()
                .success(true)
                .message("Reports retrieved successfully")
                .data(reports)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}
