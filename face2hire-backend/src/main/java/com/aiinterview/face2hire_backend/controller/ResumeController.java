package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.entity.Resume;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.serviceimpl.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/upload-url")
    public ResponseEntity<ApiResponse<ResumeUploadResponse>> getUploadUrl(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ResumeUploadRequest request) {
        Long userId = userDetails.getUser().getId();
        ResumeUploadResponse response = resumeService.generateUploadUrl(userId, request.getFileName(), request.getFileType());

        ApiResponse<ResumeUploadResponse> apiResponse = ApiResponse.<ResumeUploadResponse>builder()
                .success(true)
                .message("Pre‑signed URL generated")
                .data(response)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<Resume>> confirmUpload(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ConfirmUploadRequest request) {
        User user = userDetails.getUser();
        Resume resume = resumeService.confirmUpload(user.getId(), request, user.getFullName());

        ApiResponse<Resume> apiResponse = ApiResponse.<Resume>builder()
                .success(true)
                .message("Resume processed and stored")
                .data(resume)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<Resume>> getActiveResume(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Resume resume = resumeService.getActiveResume(userDetails.getUser().getId());

        ApiResponse<Resume> apiResponse = ApiResponse.<Resume>builder()
                .success(true)
                .message("Active resume retrieved")
                .data(resume)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(apiResponse);
    }
}