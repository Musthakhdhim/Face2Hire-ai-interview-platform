package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.AdminInterviewDetailResponseDto;
import com.aiinterview.face2hire_backend.dto.AdminInterviewFilterRequest;
import com.aiinterview.face2hire_backend.dto.AdminInterviewResponseDto;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.service.AdminInterviewService;
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
@RequestMapping("/api/v1/admin/interviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminInterviewController {

    private final AdminInterviewService adminInterviewService;

    @PostMapping("/list")
    public ResponseEntity<ApiResponse<Page<AdminInterviewResponseDto>>> getInterviews(
            @Valid @RequestBody(required = false) AdminInterviewFilterRequest filter) {
        if (filter == null) {
            filter = new AdminInterviewFilterRequest();
        }
        log.info("Admin fetching interviews with filters: search={}, type={}, status={}, page={}, size={}",
                filter.getSearch(), filter.getType(), filter.getStatus(), filter.getPage(), filter.getSize());
        Page<AdminInterviewResponseDto> interviews = adminInterviewService.getAllInterviews(filter);
        ApiResponse<Page<AdminInterviewResponseDto>> response = ApiResponse.<Page<AdminInterviewResponseDto>>builder()
                .success(true)
                .message("Interviews retrieved successfully")
                .data(interviews)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{interviewId}")
    public ResponseEntity<ApiResponse<AdminInterviewDetailResponseDto>> getInterviewDetail(
            @PathVariable Long interviewId) {
        log.info("Admin fetching interview detail for id: {}", interviewId);
        AdminInterviewDetailResponseDto detail = adminInterviewService.getInterviewDetail(interviewId);
        ApiResponse<AdminInterviewDetailResponseDto> response = ApiResponse.<AdminInterviewDetailResponseDto>builder()
                .success(true)
                .message("Interview details retrieved")
                .data(detail)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}