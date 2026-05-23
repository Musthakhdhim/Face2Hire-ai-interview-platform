package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import jakarta.mail.MessagingException;

public interface RegistrationService {
    ApiResponse<RegisterResponse> register(RegisterRequestDto request) throws MessagingException;
    ApiResponse<?> verifyUserWithOtp(VerifyOtpRequest request) throws MessagingException, OtpNotValidException;
    ApiResponse<?> resendRegistrationOtp(ResendOtpRequest request) throws MessagingException;
}
