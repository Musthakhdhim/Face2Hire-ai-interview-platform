package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.RegisterRequestDto;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.LoginResponse;
import com.aiinterview.face2hire_backend.dto.LoginRequestDto;
import com.aiinterview.face2hire_backend.dto.VerifyOtpRequest;
import com.aiinterview.face2hire_backend.dto.ForgotPasswordRequest;
import com.aiinterview.face2hire_backend.dto.ResetPasswordDto;
import com.aiinterview.face2hire_backend.dto.ResendOtpRequest;
import com.aiinterview.face2hire_backend.exception.AccountNotVerifiedException;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.service.AuthService;
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
public class AuthController {

    private final AuthService authService;
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

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequestDto loginRequest)
            throws AccountNotVerifiedException {
        log.info("Login request for email: {}", loginRequest.getEmail());
        ApiResponse<LoginResponse> response = authService.login(loginRequest);
        if (response.isSuccess()) {
            log.info("Login successful for email: {}", loginRequest.getEmail());
        } else {
            log.warn("Login failed for email: {}, reason: {}", loginRequest.getEmail(),
                    response.getMessage());
        }
        return ResponseEntity.ok(response);
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

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest forgotPasswordRequest)
            throws MessagingException {
        log.info("Forgot password request for email: {}", forgotPasswordRequest.getEmail());
        ApiResponse response = authService.resetPasswordWithOtp(forgotPasswordRequest);
        if (response.isSuccess()) {
            log.info("Password reset OTP sent to email: {}", forgotPasswordRequest.getEmail());
        } else {
            log.warn("Failed to send password reset OTP to email: {}, reason: {}",
                    forgotPasswordRequest.getEmail(), response.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-forgot-password-otp")
    public ResponseEntity<ApiResponse> verifyForgotPasswordOtp(
            @Valid @RequestBody VerifyOtpRequest request)
            throws OtpNotValidException {
        log.info("Forgot password OTP verification for email: {}", request.getEmail());
        ApiResponse response = authService.verifyOtpForgotPassword(request);
        if (response.isSuccess()) {
            log.info("Forgot password OTP verified for email: {}", request.getEmail());
        } else {
            log.warn("Forgot password OTP verification failed for email: {}, reason: {}",
                    request.getEmail(), response.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(
            @Valid @RequestBody ResetPasswordDto resetPasswordDto) {
        log.info("Password reset request for email: {}", resetPasswordDto.getEmail());
        ApiResponse response = authService.updatePassword(resetPasswordDto);
        if (response.isSuccess()) {
            log.info("Password reset successful for email: {}", resetPasswordDto.getEmail());
        } else {
            log.warn("Password reset failed for email: {}, reason: {}",
                    resetPasswordDto.getEmail(), response.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse> resendOtp(
            @Valid @RequestBody ResendOtpRequest resendOtpRequest)
            throws MessagingException {
        log.info("Resend OTP request for email: {}, type: {}", resendOtpRequest.getEmail(),
                resendOtpRequest.getType());
        ApiResponse response = authService.resendOtp(resendOtpRequest);
        if (response.isSuccess()) {
            log.info("OTP resent successfully for email: {}, type: {}",
                    resendOtpRequest.getEmail(), resendOtpRequest.getType());
        } else {
            log.warn("Failed to resend OTP for email: {}, type: {}, reason: {}",
                    resendOtpRequest.getEmail(), resendOtpRequest.getType(), response.getMessage());
        }
        return ResponseEntity.ok(response);
    }
}