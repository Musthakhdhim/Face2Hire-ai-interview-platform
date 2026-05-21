package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.service.ApplicationService;
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
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<ApiResponse<ApplicationResponseDto>> apply(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ApplicationRequestDto request) {
        ApplicationResponseDto application = applicationService.applyForJob(userDetails.getUser().getId(), request);
        ApiResponse<ApplicationResponseDto> response = ApiResponse.<ApplicationResponseDto>builder()
                .success(true)
                .message("Application submitted successfully")
                .data(application)
                .statusCode(HttpStatus.CREATED.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<ApplicationListResponseDto>>> getMyApplications(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appliedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort.Direction dir = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        Page<ApplicationListResponseDto> applications = applicationService.getMyApplications(userDetails.getUser().getId(), pageable);
        ApiResponse<Page<ApplicationListResponseDto>> response = ApiResponse.<Page<ApplicationListResponseDto>>builder()
                .success(true)
                .message("My applications retrieved")
                .data(applications)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<ApiResponse<Page<ApplicationListResponseDto>>> getApplicationsForJob(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt"));
        Page<ApplicationListResponseDto> applications = applicationService.getApplicationsForJob(jobId, pageable);
        ApiResponse<Page<ApplicationListResponseDto>> response = ApiResponse.<Page<ApplicationListResponseDto>>builder()
                .success(true)
                .message("Applications for job retrieved")
                .data(applications)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/interviewer")
    public ResponseEntity<ApiResponse<Page<ApplicationListResponseDto>>> getApplicationsForInterviewer(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt"));
        Page<ApplicationListResponseDto> applications = applicationService.getApplicationsForInterviewer(userDetails.getUser().getId(), pageable);
        ApiResponse<Page<ApplicationListResponseDto>> response = ApiResponse.<Page<ApplicationListResponseDto>>builder()
                .success(true)
                .message("Applications for interviewer retrieved")
                .data(applications)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{applicationId}/status")
    public ResponseEntity<ApiResponse<ApplicationResponseDto>> updateApplicationStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long applicationId,
            @Valid @RequestBody ApplicationStatusUpdateDto dto) throws AccessDeniedException {
        ApplicationResponseDto application = applicationService.updateApplicationStatus(applicationId, userDetails.getUser().getId(), dto);
        ApiResponse<ApplicationResponseDto> response = ApiResponse.<ApplicationResponseDto>builder()
                .success(true)
                .message("Application status updated")
                .data(application)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponseDto>> getApplicationById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) throws AccessDeniedException {
        ApplicationResponseDto dto = applicationService.getApplicationById(id, userDetails.getUser().getId());
        ApiResponse<ApplicationResponseDto> response = ApiResponse.<ApplicationResponseDto>builder()
                .success(true)
                .message("Application details retrieved")
                .data(dto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}