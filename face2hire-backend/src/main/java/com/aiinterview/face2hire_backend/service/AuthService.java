package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.RegisterRequestDto;
import com.aiinterview.face2hire_backend.dto.RegisterResponse;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.LoginResponse;
import com.aiinterview.face2hire_backend.dto.LoginRequestDto;
import com.aiinterview.face2hire_backend.dto.VerifyOtpRequest;
import com.aiinterview.face2hire_backend.dto.ForgotPasswordRequest;
import com.aiinterview.face2hire_backend.dto.ResetPasswordDto;
import com.aiinterview.face2hire_backend.dto.ResendOtpRequest;
import com.aiinterview.face2hire_backend.exception.AccountNotVerifiedException;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;

public interface AuthService {
    ApiResponse<RegisterResponse> register(RegisterRequestDto registerRequest) throws MessagingException;

    ApiResponse<LoginResponse> login(LoginRequestDto loginRequest) throws AccountNotVerifiedException;

    ApiResponse<?> verifyUserWithOtp(VerifyOtpRequest verifyOtpRequest) throws MessagingException, OtpNotValidException;

    ApiResponse<?> resetPasswordWithOtp(@Valid ForgotPasswordRequest forgotPasswordRequest)
            throws MessagingException;

    ApiResponse<?> verifyOtpForgotPassword(@Valid VerifyOtpRequest request)
            throws OtpNotValidException;

    ApiResponse<?> updatePassword(@Valid ResetPasswordDto resetPasswordDto);

    ApiResponse<?> resendOtp(ResendOtpRequest resendOtpRequest) throws MessagingException;
}
