package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.ProfileDto;
import com.aiinterview.face2hire_backend.dto.UpdateEmailDto;
import com.aiinterview.face2hire_backend.dto.UpdateEmailOtpDto;
import com.aiinterview.face2hire_backend.dto.ChangePasswordDto;
import com.aiinterview.face2hire_backend.dto.PreferenceDto;
import com.aiinterview.face2hire_backend.dto.NotificationDto;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.serviceimpl.ProfileServiceImpl;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final ProfileServiceImpl profileService;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @GetMapping
    public ResponseEntity<?> getProfile() {
        log.info("Received request to get user profile");
        ApiResponse apiResponse = profileService.getProfile();
        log.info("Profile retrieved successfully");
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/upload-photo")
    public ResponseEntity<ApiResponse<?>> uploadProfilePhoto(@RequestParam("file") MultipartFile file) {
        log.info("Received profile photo upload request, file name: {}, size: {} bytes",
                file.getOriginalFilename(), file.getSize());
        ApiResponse<?> response = profileService.uploadProfileImage(file);
        if (response.isSuccess()) {
            log.info("Profile photo uploaded successfully, URL: {}", response.getData());
        } else {
            log.warn("Profile photo upload failed: {}", response.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/update-profile")
    public ResponseEntity<ApiResponse<?>> updateProfile(@RequestBody ProfileDto profileDto) {
        log.info("Received request to update profile: fullName={}, phoneNumber={}",
                profileDto.getFullName(), profileDto.getPhoneNumber());
        ApiResponse<?> response = profileService.updateProfile(profileDto);
        if (response.isSuccess()) {
            log.info("Profile updated successfully");
        } else {
            log.warn("Profile update failed: {}", response.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/update-email")
    public ResponseEntity<ApiResponse<?>> updateProfileEmail(@RequestBody @Valid UpdateEmailDto updateEmailDto)
            throws MessagingException {
        log.info("Received request to update email to: {}", updateEmailDto.getEmail());
        ApiResponse<?> response = profileService.updateEmail(updateEmailDto);
        if (response.isSuccess()) {
            log.info("OTPs sent for email update to: {}", updateEmailDto.getEmail());
        } else {
            log.warn("Email update request failed: {}", response.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/update-email/verify-otp")
    public ResponseEntity<ApiResponse<?>> updateProfileOtp(@RequestBody @Valid UpdateEmailOtpDto updateEmailOtpDto)
            throws MessagingException, OtpNotValidException {
        log.info("Received OTP verification for email update, new email: {}", updateEmailOtpDto.getNewEmail());
        ApiResponse<?> response = profileService.updateEmailVerifyOtp(updateEmailOtpDto);
        if (response.isSuccess()) {
            log.info("Email updated successfully to: {}", updateEmailOtpDto.getNewEmail());
        } else {
            log.warn("Email update OTP verification failed: {}", response.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<?>> updatePassword(@RequestBody @Valid ChangePasswordDto changePasswordDto) {
        log.info("Received password change request");
        ApiResponse<?> response = profileService.changePassword(changePasswordDto);
        if (response.isSuccess()) {
            log.info("Password changed successfully");
        } else {
            log.warn("Password change failed: {}", response.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<?>> getPreferences() {
        log.info("Received request to get user preferences");
        ApiResponse<?> response = profileService.getPreferences();
        log.info("Preferences retrieved successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<?>> updatePreferences(@RequestBody PreferenceDto preferenceDto) {
        log.info("Received request to update preferences: type={}, avatarStyle={}, language={}",
                preferenceDto.getDefaultInterviewType(), preferenceDto.getAvatarStyle(), preferenceDto.getLanguage());
        ApiResponse<?> response = profileService.updatePreference(preferenceDto);
        if (response.isSuccess()) {
            log.info("Preferences updated successfully");
        } else {
            log.warn("Preferences update failed: {}", response.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<?>> getNotifications() {
        log.info("Received request to get notification settings");
        ApiResponse<?> response = profileService.getNotifications();
        log.info("Notification settings retrieved successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/notifications")
    public ResponseEntity<ApiResponse<?>> updateNotifications(@RequestBody NotificationDto notificationDto) {
        log.info("Received request to update notification settings");
        ApiResponse<?> response = profileService.updateNotifications(notificationDto);
        if (response.isSuccess()) {
            log.info("Notification settings updated successfully");
        } else {
            log.warn("Notification settings update failed: {}", response.getMessage());
        }
        return ResponseEntity.ok(response);
    }
}