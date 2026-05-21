package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @PostMapping
    public ResponseEntity<ApiResponse<JobResponseDto>> createJob(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody JobRequestDto request) {
        JobResponseDto job = jobService.createJob(userDetails.getUser().getId(), request);
        ApiResponse<JobResponseDto> response = ApiResponse.<JobResponseDto>builder()
                .success(true)
                .message("Job created successfully")
                .data(job)
                .statusCode(HttpStatus.CREATED.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<JobResponseDto>> getJob(@PathVariable Long jobId) {
        JobResponseDto job = jobService.getJobById(jobId);
        ApiResponse<JobResponseDto> response = ApiResponse.<JobResponseDto>builder()
                .success(true)
                .message("Job retrieved")
                .data(job)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-jobs")
    public ResponseEntity<ApiResponse<Page<JobListResponseDto>>> getMyJobs(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort.Direction dir = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        Page<JobListResponseDto> jobs = jobService.getJobsByInterviewer(userDetails.getUser().getId(), pageable);
        ApiResponse<Page<JobListResponseDto>> response = ApiResponse.<Page<JobListResponseDto>>builder()
                .success(true)
                .message("My jobs retrieved")
                .data(jobs)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<JobListResponseDto>>> getAllActiveJobs(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort.Direction dir = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        Page<JobListResponseDto> jobs = jobService.getAllActiveJobs(search, pageable);
        ApiResponse<Page<JobListResponseDto>> response = ApiResponse.<Page<JobListResponseDto>>builder()
                .success(true)
                .message("Active jobs retrieved")
                .data(jobs)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{jobId}")
    public ResponseEntity<ApiResponse<JobResponseDto>> updateJob(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobId,
            @Valid @RequestBody JobRequestDto request) throws AccessDeniedException {
        JobResponseDto job = jobService.updateJob(jobId, userDetails.getUser().getId(), request);
        ApiResponse<JobResponseDto> response = ApiResponse.<JobResponseDto>builder()
                .success(true)
                .message("Job updated")
                .data(job)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{jobId}")
    public ResponseEntity<ApiResponse<Void>> deleteJob(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobId) throws AccessDeniedException {
        jobService.deleteJob(jobId, userDetails.getUser().getId());
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Job deleted")
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{jobId}/close")
    public ResponseEntity<ApiResponse<JobResponseDto>> closeJob(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobId) throws AccessDeniedException {
        JobResponseDto job = jobService.closeJob(jobId, userDetails.getUser().getId());
        ApiResponse<JobResponseDto> response = ApiResponse.<JobResponseDto>builder()
                .success(true)
                .message("Job closed")
                .data(job)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}