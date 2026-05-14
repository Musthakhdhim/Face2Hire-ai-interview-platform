package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import org.springframework.web.multipart.MultipartFile;

public interface ProfileService {
    ApiResponse<?> getProfile();

    ApiResponse<?> uploadProfileImage(MultipartFile file);

    ApiResponse<?> updateProfile(ProfileDto profileDto);

    ApiResponse<?> updateEmail(@Valid UpdateEmailDto updateEmailDto) throws MessagingException;

    ApiResponse<?> updateEmailVerifyOtp(@Valid UpdateEmailOtpDto emailOtpDto) throws MessagingException, OtpNotValidException;

    ApiResponse<?> changePassword(ChangePasswordDto changePasswordDto);

    ApiResponse<?> getPreferences();

    ApiResponse<?> updatePreference(PreferenceDto preferenceDto);

    ApiResponse<?> getNotifications();

    ApiResponse<?> updateNotifications(NotificationDto notificationDto);
}
