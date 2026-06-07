package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.EmailRequestDto;
import com.aiinterview.face2hire_backend.service.AdminEmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/email")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmailController {

    private final AdminEmailService adminEmailService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Void>> sendBulkEmail(@Valid @RequestBody EmailRequestDto request) {
        log.info("Admin sending bulk email: type={}, subject={}", request.getRecipientType(), request.getSubject());
        adminEmailService.sendBulkEmail(request);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Emails sent successfully")
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}