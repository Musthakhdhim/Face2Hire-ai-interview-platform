package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.entity.OtpType;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.entity.UserNotifications;
import com.aiinterview.face2hire_backend.entity.UserPreferences;
import com.aiinterview.face2hire_backend.exception.AlreadyExistsException;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import com.aiinterview.face2hire_backend.exception.PasswordNotMatchException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.UserNotificationRepository;
import com.aiinterview.face2hire_backend.repository.UserPreferenceRepository;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.service.*;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.ProfileDto;
import com.aiinterview.face2hire_backend.dto.UpdateEmailDto;
import com.aiinterview.face2hire_backend.dto.UpdateEmailOtpDto;
import com.aiinterview.face2hire_backend.dto.ChangePasswordDto;
import com.aiinterview.face2hire_backend.dto.PreferenceDto;
import com.aiinterview.face2hire_backend.dto.ProfileResponseDto;
import com.aiinterview.face2hire_backend.dto.NotificationDto;
import java.io.IOException;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final JwtService jwtService;
    private final ModelMapper modelMapper;
    private final S3FileUploadService s3FileUploadService;
    private final EmailService emailService;
    private final OtpService otpServiceImpl;
    private final PasswordEncoder passwordEncoder;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @Override
    public ApiResponse<?> getProfile() {
        log.info("Fetching profile for current user");
        User user = jwtService.getCurrentLoginUser();
        if (user == null) {
            log.warn("Profile fetch failed – user not authenticated");
            return ApiResponse.builder()
                    .success(false)
                    .message("User not authenticated")
                    .statusCode(HttpStatus.UNAUTHORIZED.value())
                    .time(LocalDateTime.now())
                    .build();
        }
        ProfileResponseDto profileResponseDto = modelMapper.map(user, ProfileResponseDto.class);
        log.info("Profile retrieved for user: {}", user.getEmail());
        return ApiResponse.builder()
                .success(true)
                .message(null)
                .data(profileResponseDto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> uploadProfileImage(MultipartFile file) {
        log.info("Uploading profile photo – filename: {}, size: {} bytes", file.getOriginalFilename(), file.getSize());
        try {
            String imageUrl = s3FileUploadService.uploadProfileImage(file);
            log.info("Profile photo uploaded successfully – URL: {}", imageUrl);
            return ApiResponse.builder()
                    .success(true)
                    .message("Profile photo uploaded successfully")
                    .data(imageUrl)
                    .statusCode(HttpStatus.OK.value())
                    .time(LocalDateTime.now())
                    .build();
        } catch (IOException e) {
            log.error("Profile photo upload failed – I/O error", e);
            return ApiResponse.builder()
                    .success(false)
                    .message("File upload failed: " + e.getMessage())
                    .data(null)
                    .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .time(LocalDateTime.now())
                    .build();
        } catch (RuntimeException e) {
            log.error("Profile photo upload failed – runtime error", e);
            return ApiResponse.builder()
                    .success(false)
                    .message("File upload failed: " + e.getMessage())
                    .data(null)
                    .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .time(LocalDateTime.now())
                    .build();
        }
    }

    @Override
    public ApiResponse<?> updateProfile(ProfileDto profileDto) {
        log.info("Updating profile for current user – fullName: {}, phoneNumber: {}",
                profileDto.getFullName(), profileDto.getPhoneNumber());
        User user = jwtService.getCurrentLoginUser();
        if (user == null) {
            log.warn("Profile update failed – user not authenticated");
            return ApiResponse.builder()
                    .success(false)
                    .message("User not authenticated")
                    .statusCode(HttpStatus.UNAUTHORIZED.value())
                    .time(LocalDateTime.now())
                    .build();
        }
        if (profileDto.getFullName() != null) {
            user.setFullName(profileDto.getFullName());
        }
        if (profileDto.getPhoneNumber() != null) {
            user.setPhoneNumber(profileDto.getPhoneNumber());
        }
        if (profileDto.getProfileImageUrl() != null) {
            user.setProfileImageUrl(profileDto.getProfileImageUrl());
        }
        User savedUser = userRepository.save(user);
        ProfileResponseDto profileResponseDto = modelMapper.map(savedUser, ProfileResponseDto.class);
        log.info("Profile updated successfully for user: {}", savedUser.getEmail());
        return ApiResponse.builder()
                .success(true)
                .message("user profile updated successfully")
                .data(profileResponseDto)
                .statusCode(200)
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> updateEmail(@Valid UpdateEmailDto updateEmailDto) throws MessagingException {
        log.info("Update email request – new email: {}", updateEmailDto.getEmail());
        boolean existingUser = userRepository.existsByEmail(updateEmailDto.getEmail());
        if (existingUser) {
            log.warn("Email update failed – new email already exists: {}", updateEmailDto.getEmail());
            throw new AlreadyExistsException(updateEmailDto.getEmail() +
                    " already exists, please use another account");
        }

        User user = jwtService.getCurrentLoginUser();
        if (user == null) {
            log.warn("Email update failed – user not authenticated");
            return ApiResponse.builder()
                    .success(false)
                    .message("User not authenticated")
                    .statusCode(HttpStatus.UNAUTHORIZED.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        if (user.getEmail().equals(updateEmailDto.getEmail())) {
            log.warn("Email update failed – new email same as old for user: {}", user.getEmail());
            throw new RuntimeException("New email must be different");
        }

        emailService.updateEmailOtp(user.getEmail());
        emailService.updateEmailOtp(updateEmailDto.getEmail());
        log.info("OTPs sent to old email {} and new email {}", user.getEmail(), updateEmailDto.getEmail());

        return ApiResponse.builder()
                .success(true)
                .data(null)
                .message("otp has been sent to old and new email, please verify using the otps")
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> updateEmailVerifyOtp(@Valid UpdateEmailOtpDto emailOtpDto)
            throws MessagingException, OtpNotValidException {
        log.info("Verifying OTP for email update – new email: {}", emailOtpDto.getNewEmail());
        User user = jwtService.getCurrentLoginUser();
        if (user == null) {
            log.warn("Email OTP verification failed – user not authenticated");
            return ApiResponse.builder()
                    .success(false)
                    .message("User not authenticated")
                    .statusCode(HttpStatus.UNAUTHORIZED.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        boolean isValidOldEmailOtp = otpServiceImpl.validateOtp(user.getEmail(),
                OtpType.UPDATE_EMAIL, emailOtpDto.getOldEmailOtp());
        boolean isValidNewEmailOtp = otpServiceImpl.validateOtp(emailOtpDto.getNewEmail(),
                OtpType.UPDATE_EMAIL, emailOtpDto.getNewEmailOtp());

        if (!isValidOldEmailOtp || !isValidNewEmailOtp) {
            log.warn("Email OTP verification failed for user: {} – old OTP valid: {}, new OTP valid: {}",
                    user.getEmail(), isValidOldEmailOtp, isValidNewEmailOtp);
            throw new OtpNotValidException("otp is not valid, enter the correct otp");
        }

        user.setEmail(emailOtpDto.getNewEmail());
        userRepository.save(user);
        log.info("Email updated successfully for user: {} -> {}", user.getEmail(), emailOtpDto.getNewEmail());

        return ApiResponse.builder()
                .success(true)
                .message("email updated successfully")
                .data(null)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> changePassword(ChangePasswordDto changePasswordDto) {
        log.info("Password change request for current user");
        User user = jwtService.getCurrentLoginUser();
        if (user == null) {
            log.warn("Password change failed – user not authenticated");
            return ApiResponse.builder()
                    .success(false)
                    .message("User not authenticated")
                    .statusCode(HttpStatus.UNAUTHORIZED.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        if (!passwordEncoder.matches(changePasswordDto.getOldPassword(), user.getPassword())) {
            log.warn("Password change failed – incorrect old password for user: {}", user.getEmail());
            throw new PasswordNotMatchException("existing password is incorrect");
        }

        if (!changePasswordDto.getNewPassword().equals(changePasswordDto.getConfirmPassword())) {
            log.warn("Password change failed – password mismatch for user: {}", user.getEmail());
            throw new PasswordNotMatchException("password does not match");
        }

        user.setPassword(passwordEncoder.encode(changePasswordDto.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", user.getEmail());

        return ApiResponse.builder()
                .success(true)
                .message("password updated successfully")
                .data(null)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now()).build();
    }

    @Override
    public ApiResponse<?> getPreferences() {
        log.info("Fetching preferences for current user");
        User user = jwtService.getCurrentLoginUser();
        if (user == null) {
            log.warn("Preferences fetch failed – user not authenticated");
            return ApiResponse.builder()
                    .success(false)
                    .message("User not authenticated")
                    .statusCode(HttpStatus.UNAUTHORIZED.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        UserPreferences preferences = user.getPreferences();
        if (preferences == null) {
            log.info("Preferences not found – initializing default for user: {}", user.getEmail());
            user.initSettings();
            userRepository.save(user);
            preferences = user.getPreferences();
        }

        PreferenceDto dto = PreferenceDto.builder()
                .defaultInterviewType(preferences.getDefaultInterviewType())
                .avatarStyle(preferences.getAvatarStyle())
                .language(preferences.getLanguage())
                .build();

        log.info("Preferences retrieved for user: {}", user.getEmail());
        return ApiResponse.builder()
                .success(true)
                .message("Preferences retrieved")
                .data(dto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> updatePreference(PreferenceDto preferenceDto) {
        log.info("Updating preferences for current user – type: {}, avatarStyle: {}, language: {}",
                preferenceDto.getDefaultInterviewType(), preferenceDto.getAvatarStyle(), preferenceDto.getLanguage());
        User user = jwtService.getCurrentLoginUser();
        if (user == null) {
            log.warn("Preferences update failed – user not authenticated");
            return ApiResponse.builder()
                    .success(false)
                    .message("User not authenticated")
                    .statusCode(HttpStatus.UNAUTHORIZED.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        UserPreferences preferences = user.getPreferences();
        if (preferences == null) {
            log.info("Preferences not found – initializing default for user: {}", user.getEmail());
            user.initSettings();
            preferences = user.getPreferences();
        }

        if (preferenceDto.getDefaultInterviewType() != null) {
            preferences.setDefaultInterviewType(preferenceDto.getDefaultInterviewType());
        }
        if (preferenceDto.getAvatarStyle() != null) {
            preferences.setAvatarStyle(preferenceDto.getAvatarStyle());
        }
        if (preferenceDto.getLanguage() != null) {
            preferences.setLanguage(preferenceDto.getLanguage());
        }

        userPreferenceRepository.save(preferences);
        user.setPreferences(preferences);
        userRepository.save(user);
        log.info("Preferences updated successfully for user: {}", user.getEmail());

        return ApiResponse.builder()
                .success(true)
                .message("Preferences updated successfully")
                .data(preferenceDto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> getNotifications() {
        log.info("Fetching notification settings for current user");
        User user = jwtService.getCurrentLoginUser();
        if (user == null) {
            log.warn("Notification settings fetch failed – user not authenticated");
            return ApiResponse.builder()
                    .success(false)
                    .message("User not authenticated")
                    .statusCode(HttpStatus.UNAUTHORIZED.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        UserNotifications notifications = user.getNotifications();
        if (notifications == null) {
            log.info("Notification settings not found – initializing default for user: {}", user.getEmail());
            user.initSettings();
            userRepository.save(user);
            notifications = user.getNotifications();
        }

        NotificationDto dto = NotificationDto.builder()
                .emailUpdates(notifications.isEmailUpdates())
                .interviewReminders(notifications.isInterviewReminders())
                .marketingEmails(notifications.isMarketingEmails())
                .build();

        log.info("Notification settings retrieved for user: {}", user.getEmail());
        return ApiResponse.builder()
                .success(true)
                .message("Notification settings retrieved")
                .data(dto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> updateNotifications(NotificationDto notificationDto) {
        log.info("Updating notification settings for current user");
        User user = jwtService.getCurrentLoginUser();
        if (user == null) {
            log.warn("Notification settings update failed – user not authenticated");
            return ApiResponse.builder()
                    .success(false)
                    .message("User not authenticated")
                    .statusCode(HttpStatus.UNAUTHORIZED.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        UserNotifications notifications = user.getNotifications();
        if (notifications == null) {
            log.info("Notification settings not found – initializing default for user: {}", user.getEmail());
            user.initSettings();
            notifications = user.getNotifications();
        }

        notifications.setEmailUpdates(notificationDto.isEmailUpdates());
        notifications.setInterviewReminders(notificationDto.isInterviewReminders());
        notifications.setMarketingEmails(notificationDto.isMarketingEmails());

        userNotificationRepository.save(notifications);
        user.setNotifications(notifications);
        userRepository.save(user);
        log.info("Notification settings updated successfully for user: {}", user.getEmail());

        return ApiResponse.builder()
                .success(true)
                .message("Notification settings updated")
                .data(notificationDto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }
}
