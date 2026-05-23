package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.RegisterRequestDto;
import com.aiinterview.face2hire_backend.dto.ResendOtpRequest;
import com.aiinterview.face2hire_backend.dto.VerifyOtpRequest;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.service.AuthService;
import com.aiinterview.face2hire_backend.service.RegistrationService;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService authService;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> registerUser(@Valid @RequestBody
                                                    RegisterRequestDto registerRequest)
            throws MessagingException {
        log.info("Registration request for email: {}", registerRequest.getEmail());
        ApiResponse apiResponse = authService.register(registerRequest);
        log.info("Registration completed for email: {}, success: {}",
                registerRequest.getEmail(), apiResponse.isSuccess());
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyAccountUsingOtp(@Valid @RequestBody
                                                             VerifyOtpRequest verifyOtpRequest)
            throws MessagingException, OtpNotValidException {
        log.info("OTP verification request for email: {}", verifyOtpRequest.getEmail());
        ApiResponse response = authService.verifyUserWithOtp(verifyOtpRequest);
        if (response.isSuccess()) {
            log.info("OTP verification successful for email: {}", verifyOtpRequest.getEmail());
        } else {
            log.warn("OTP verification failed for email: {}, reason: {}",
                    verifyOtpRequest.getEmail(), response.getMessage());
        }
        return ResponseEntity.ok(response);
    }
}
