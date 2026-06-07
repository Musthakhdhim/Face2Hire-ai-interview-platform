package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.ActivityLogDto;
import com.aiinterview.face2hire_backend.dto.ActivityLogFilterRequest;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/activities")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminActivityController {

    private final ActivityLogService activityLogService;

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<ActivityLogDto>>> getRecentActivities() {
        List<ActivityLogDto> recent = activityLogService.getRecentActivities();
        ApiResponse<List<ActivityLogDto>> response = ApiResponse.<List<ActivityLogDto>>builder()
                .success(true)
                .message("Recent activities retrieved")
                .data(recent)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/list")
    public ResponseEntity<ApiResponse<Page<ActivityLogDto>>> getActivities(
            @RequestBody(required = false) ActivityLogFilterRequest filter) {
        if (filter == null) filter = new ActivityLogFilterRequest();
        Page<ActivityLogDto> activities = activityLogService.getFilteredActivities(filter);
        ApiResponse<Page<ActivityLogDto>> response = ApiResponse.<Page<ActivityLogDto>>builder()
                .success(true)
                .message("Activities retrieved")
                .data(activities)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}