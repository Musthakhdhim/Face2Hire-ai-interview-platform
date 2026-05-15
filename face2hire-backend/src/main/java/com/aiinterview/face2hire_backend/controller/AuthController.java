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
import com.aiinterview.face2hire_backend.service.AuthService;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;


    @PostMapping("/register")
    public ResponseEntity<ApiResponse> registerUser(@Valid @RequestBody RegisterRequestDto registerRequest)
            throws MessagingException {
        log.info("Registration request for email: {}", registerRequest.getEmail());
        ApiResponse apiResponse = authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequestDto loginRequest)
            throws AccountNotVerifiedException {
        log.info("Login request for email: {}", loginRequest.getEmail());
        ApiResponse<LoginResponse> response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyAccountUsingOtp(@Valid @RequestBody VerifyOtpRequest verifyOtpRequest)
            throws MessagingException, OtpNotValidException {
        log.info("OTP verification request for email: {}", verifyOtpRequest.getEmail());
        ApiResponse response = authService.verifyUserWithOtp(verifyOtpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest forgotPasswordRequest)
            throws MessagingException {
        log.info("Forgot password request for email: {}", forgotPasswordRequest.getEmail());
        ApiResponse response = authService.resetPasswordWithOtp(forgotPasswordRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-forgot-password-otp")
    public ResponseEntity<ApiResponse> verifyForgotPasswordOtp(@Valid @RequestBody VerifyOtpRequest request)
            throws OtpNotValidException {
        log.info("Forgot password OTP verification for email: {}", request.getEmail());
        ApiResponse response = authService.verifyOtpForgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordDto resetPasswordDto) {
        log.info("Password reset request for email: {}", resetPasswordDto.getEmail());
        ApiResponse response = authService.updatePassword(resetPasswordDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse> resendOtp(@Valid @RequestBody ResendOtpRequest resendOtpRequest)
            throws MessagingException {
        log.info("Resend OTP request for email: {}, type: {}",
                resendOtpRequest.getEmail(), resendOtpRequest.getType());
        ApiResponse response = authService.resendOtp(resendOtpRequest);
        return ResponseEntity.ok(response);
    }

}