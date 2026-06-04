package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.AdminJobDetailResponseDto;
import com.aiinterview.face2hire_backend.dto.AdminJobFilterRequest;
import com.aiinterview.face2hire_backend.dto.AdminJobResponseDto;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.service.AdminJobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/jobs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminJobController {

    private final AdminJobService adminJobService;

    @PostMapping("/list")
    public ResponseEntity<ApiResponse<Page<AdminJobResponseDto>>> getJobs(
            @Valid @RequestBody(required = false) AdminJobFilterRequest filter) {
        if (filter == null) {
            filter = new AdminJobFilterRequest();
        }
        log.info("Admin fetching jobs with filters: search={}, type={}, status={}, postedByUserId={}, page={}, size={}",
                filter.getSearch(), filter.getType(), filter.getStatus(), filter.getPostedByUserId(), filter.getPage(), filter.getSize());
        Page<AdminJobResponseDto> jobs = adminJobService.getAllJobs(filter);
        ApiResponse<Page<AdminJobResponseDto>> response = ApiResponse.<Page<AdminJobResponseDto>>builder()
                .success(true)
                .message("Jobs retrieved successfully")
                .data(jobs)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<AdminJobDetailResponseDto>> getJobDetail(
            @PathVariable Long jobId) {
        log.info("Admin fetching job detail for id: {}", jobId);
        AdminJobDetailResponseDto detail = adminJobService.getJobDetail(jobId);
        ApiResponse<AdminJobDetailResponseDto> response = ApiResponse.<AdminJobDetailResponseDto>builder()
                .success(true)
                .message("Job details retrieved")
                .data(detail)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}