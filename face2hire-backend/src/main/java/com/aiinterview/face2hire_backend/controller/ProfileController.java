package com.aiinterview.face2hire_backend.controller;


import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import com.aiinterview.face2hire_backend.serviceimpl.ProfileServiceImpl;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final ProfileServiceImpl profileService;

    @GetMapping
    public ResponseEntity<?> getProfile() {

        ApiResponse apiResponse =profileService.getProfile();

        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/upload-photo")
    public ResponseEntity<ApiResponse<?>> uploadProfilePhoto(
            @RequestParam("file") MultipartFile file) {

        return ResponseEntity.ok(profileService.uploadProfileImage(file));

    }

    @PutMapping("/update-profile")
    public ResponseEntity<ApiResponse<?>> updateProfile(@RequestBody ProfileDto profileDto) {
        return ResponseEntity.ok(profileService.updateProfile(profileDto));
    }

    @PutMapping("/update-email")
    public ResponseEntity<ApiResponse<?>> updateProfileEmail(
            @RequestBody @Valid UpdateEmailDto updateEmailDto
    ) throws MessagingException {
        return ResponseEntity.ok(profileService.updateEmail(updateEmailDto));
    }

    @PutMapping("/update-email/verify-otp")
    public ResponseEntity<ApiResponse<?>> updateProfileOtp(
            @RequestBody @Valid UpdateEmailOtpDto updateEmailOtpDto
    ) throws MessagingException, OtpNotValidException {
        return ResponseEntity.ok(profileService.updateEmailVerifyOtp(updateEmailOtpDto));
    }


    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<?>> updatePassword(@RequestBody @Valid ChangePasswordDto changePasswordDto) {
        return ResponseEntity.
                ok(profileService.changePassword(changePasswordDto));
    }


    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<?>> getPreferences() {
        return ResponseEntity.ok(profileService.getPreferences());
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<?>> updatePreferences(@RequestBody PreferenceDto preferenceDto) {
        return ResponseEntity.ok(profileService.updatePreference(preferenceDto));
    }


    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<?>> getNotifications() {
        return ResponseEntity.ok(profileService.getNotifications());
    }

    @PutMapping("/notifications")
    public ResponseEntity<ApiResponse<?>> updateNotifications(@RequestBody NotificationDto notificationDto) {
        return ResponseEntity.ok(profileService.updateNotifications(notificationDto));
    }

}
