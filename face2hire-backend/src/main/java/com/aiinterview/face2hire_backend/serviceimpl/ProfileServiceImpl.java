package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.entity.OtpType;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.entity.UserNotifications;
import com.aiinterview.face2hire_backend.entity.UserPreferences;
import com.aiinterview.face2hire_backend.exception.AlreadyExistsException;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import com.aiinterview.face2hire_backend.exception.PasswordNotMatchException;
import com.aiinterview.face2hire_backend.repository.UserNotificationRepository;
import com.aiinterview.face2hire_backend.repository.UserPreferenceRepository;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.service.EmailService;
import com.aiinterview.face2hire_backend.service.JwtService;
import com.aiinterview.face2hire_backend.service.ProfileService;
import com.aiinterview.face2hire_backend.service.S3FileUploadService;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final JwtService jwtService;
    private final ModelMapper modelMapper;
    private final S3FileUploadService s3FileUploadService;
    private final EmailService emailService;
    private final OtpServiceImpl otpServiceImpl;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ApiResponse<?> getProfile() {

        User user= jwtService.getCurrentLoginUser();

        ProfileResponseDto profileResponseDto=modelMapper.map(user, ProfileResponseDto.class);

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
        try {
            String imageUrl = s3FileUploadService.uploadProfileImage(file);

            ApiResponse response=ApiResponse.builder()
                    .success(true)
                    .message("Profile photo uploaded successfully")
                    .data(imageUrl)
                    .statusCode(HttpStatus.OK.value())
                    .time(LocalDateTime.now())
                    .build();

            return response;
        } catch (IOException e) {
            log.error("File upload failed", e);

            return ApiResponse.builder()
                    .success(false)
                    .message("File upload failed"+ e)
                    .data(null)
                    .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .time(LocalDateTime.now())
                    .build();

        } catch (RuntimeException e) {
            return ApiResponse.builder()
                    .success(false)
                    .message("File upload failed"+ e)
                    .data(null)
                    .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .time(LocalDateTime.now())
                    .build();
        }
    }

    @Override
    public ApiResponse<?> updateProfile(ProfileDto profileDto) {
        User user = jwtService.getCurrentLoginUser();
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

        boolean existingUser=userRepository.existsByEmail(updateEmailDto.getEmail());

        if(existingUser){
            throw new AlreadyExistsException(updateEmailDto.getEmail()+" already exists, please use another account");
        }


        User user= jwtService.getCurrentLoginUser();
        emailService.updateEmailOtp(user.getEmail());

        if (user.getEmail().equals(updateEmailDto.getEmail())) { throw new RuntimeException("New email must be different"); }


        emailService.updateEmailOtp(updateEmailDto.getEmail());

        return ApiResponse.builder()
                .success(true)
                .data(null)
                .message("otp has been sent to old and new email, please verify uing the otps")
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> updateEmailVerifyOtp(@Valid UpdateEmailOtpDto emailOtpDto) throws MessagingException, OtpNotValidException {
        User user= jwtService.getCurrentLoginUser();
        boolean isValidOldEmailOtp = otpServiceImpl.validateOtp(user.getEmail(), OtpType.UPDATE_EMAIL, emailOtpDto.getOldEmailOtp());

        boolean isValidNewEmailOtp = otpServiceImpl.validateOtp(emailOtpDto.getNewEmail(), OtpType.UPDATE_EMAIL, emailOtpDto.getNewEmailOtp());

        if(!isValidOldEmailOtp || !isValidNewEmailOtp){
            throw new OtpNotValidException("otp is not valid, enter the correct otp");
        }

        user.setEmail(emailOtpDto.getNewEmail());
        userRepository.save(user);

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
        User user= jwtService.getCurrentLoginUser();

        if(!passwordEncoder.matches(changePasswordDto.getOldPassword(), user.getPassword())){
            throw new PasswordNotMatchException("existing password is incorrect");
        }

        if(!changePasswordDto.getNewPassword().equals(changePasswordDto.getConfirmPassword())){
            throw new PasswordNotMatchException("password does not match");
        }

        user.setPassword(passwordEncoder.encode(changePasswordDto.getNewPassword()));
        userRepository.save(user);

        return ApiResponse.builder()
                .success(true)
                .message("password updated successfully")
                .data(null)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now()).build();

    }


    @Override
    public ApiResponse<?> getPreferences() {
        User user = jwtService.getCurrentLoginUser();
        UserPreferences preferences = user.getPreferences();
        if (preferences == null) {
            user.initSettings();
            userRepository.save(user);
            preferences = user.getPreferences();
        }

        PreferenceDto dto = PreferenceDto.builder()
                .defaultInterviewType(preferences.getDefaultInterviewType())
                .avatarStyle(preferences.getAvatarStyle())
                .language(preferences.getLanguage())
                .build();

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
        User user = jwtService.getCurrentLoginUser();
        UserPreferences preferences = user.getPreferences();
        if (preferences == null) {
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
        User user = jwtService.getCurrentLoginUser();
        UserNotifications notifications = user.getNotifications();
        if (notifications == null) {
            user.initSettings();
            userRepository.save(user);
            notifications = user.getNotifications();
        }

        NotificationDto dto = NotificationDto.builder()
                .emailUpdates(notifications.isEmailUpdates())
                .interviewReminders(notifications.isInterviewReminders())
                .marketingEmails(notifications.isMarketingEmails())
                .build();

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
        User user = jwtService.getCurrentLoginUser();
        UserNotifications notifications = user.getNotifications();
        if (notifications == null) {
            user.initSettings();
            notifications = user.getNotifications();
        }

        notifications.setEmailUpdates(notificationDto.isEmailUpdates());
        notifications.setInterviewReminders(notificationDto.isInterviewReminders());
        notifications.setMarketingEmails(notificationDto.isMarketingEmails());

        userNotificationRepository.save(notifications);
        user.setNotifications(notifications);
        userRepository.save(user);

        return ApiResponse.builder()
                .success(true)
                .message("Notification settings updated")
                .data(notificationDto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }



}
