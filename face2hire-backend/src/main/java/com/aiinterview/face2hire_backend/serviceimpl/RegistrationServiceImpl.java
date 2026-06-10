package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.entity.ActivityAction;
import com.aiinterview.face2hire_backend.entity.OtpType;
import com.aiinterview.face2hire_backend.entity.Role;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.exception.AlreadyExistsException;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import com.aiinterview.face2hire_backend.exception.PasswordNotMatchException;
import com.aiinterview.face2hire_backend.exception.UserNotFoundException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.service.ActivityLogService;
import com.aiinterview.face2hire_backend.service.EmailService;
import com.aiinterview.face2hire_backend.service.OtpService;
import com.aiinterview.face2hire_backend.service.RegistrationService;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final OtpService otpServiceImpl;
    private final EmailService emailService;
    private final ActivityLogService activityLogService;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Override
    public ApiResponse<RegisterResponse> register(RegisterRequestDto registerRequest)
            throws MessagingException {
        log.info("Register request for email: {}", registerRequest.getEmail());

        User existingUser = userRepository.findByEmail(registerRequest.getEmail());
        if (existingUser != null) {
            if (existingUser.isVerified()) {
                throw new AlreadyExistsException("user with this email: " + registerRequest.getEmail() + " already exists");
            } else {
                existingUser.setUserName(registerRequest.getUserName());
                existingUser.setUpdatedAt(LocalDateTime.now());
                userRepository.save(existingUser);

                otpServiceImpl.invalidateOtp(existingUser.getEmail(), OtpType.REGISTRATION);
                emailService.sendVerificationEmail(existingUser);

                RegisterResponse response = RegisterResponse.builder()
                        .id(existingUser.getId())
                        .userName(existingUser.getUserName())
                        .email(existingUser.getEmail())
                        .role(existingUser.getRole())
                        .requireVerification(true)
                        .build();
                return ApiResponse.<RegisterResponse>builder()
                        .message("Account already exists but not verified. A new verification OTP has been sent.")
                        .data(response)
                        .success(true)
                        .statusCode(HttpStatus.OK.value())
                        .time(LocalDateTime.now())
                        .build();
            }
        }

        if (userRepository.existsByUserName(registerRequest.getUserName())) {
            throw new AlreadyExistsException("user with this username already exists");
        }
        if (!registerRequest.isPasswordMatching()) {
            throw new PasswordNotMatchException("password does not match confirm password");
        }

        User user = modelMapper.map(registerRequest, User.class);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setVerified(false);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setActive(true);
        if (user.getRole() == null) {
            user.setRole(Role.INTERVIEWEE);
        }

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: email={}", savedUser.getEmail());

        emailService.sendVerificationEmail(savedUser);

        RegisterResponse registerResponse = RegisterResponse.builder()
                .id(savedUser.getId())
                .userName(savedUser.getUserName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .requireVerification(true)
                .build();

        return ApiResponse.<RegisterResponse>builder()
                .message("User registered successfully. Please verify your email with the OTP sent.")
                .data(registerResponse)
                .success(true)
                .statusCode(HttpStatus.CREATED.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> verifyUserWithOtp(VerifyOtpRequest verifyOtpRequest)
            throws MessagingException, OtpNotValidException {
        log.info("OTP verification attempt for email: {}", verifyOtpRequest.getEmail());

        User user = userRepository.findByEmail(verifyOtpRequest.getEmail());
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + verifyOtpRequest.getEmail());
        }
        if (user.isVerified()) {
            return ApiResponse.builder()
                    .success(false)
                    .message("Account is already verified")
                    .data(null)
                    .statusCode(HttpStatus.BAD_REQUEST.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        boolean isValid = otpServiceImpl.validateOtp(user.getEmail(), OtpType.REGISTRATION, verifyOtpRequest.getOtp());
        if (!isValid) {
            throw new OtpNotValidException("Your OTP is incorrect or expired. Please request a new one.");
        }

        user.setVerified(true);
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        if (activityLogService != null) {
            activityLogService.log(savedUser, ActivityAction.REGISTER, "User registered and verified email");
        }
        log.info("Account verified successfully for email: {}", savedUser.getEmail());

        RegisterResponse response = RegisterResponse.builder()
                .id(savedUser.getId())
                .userName(savedUser.getUserName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .requireVerification(false)
                .build();

        return ApiResponse.builder()
                .success(true)
                .message("Verification successful! You can now login.")
                .data(response)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> resendRegistrationOtp(ResendOtpRequest request) throws MessagingException {
        String email = request.getEmail();
        log.info("Resend registration OTP for email: {}", email);
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }
        if (user.isVerified()) {
            return ApiResponse.builder()
                    .success(false)
                    .message("Account is already verified. Please login.")
                    .data(null)
                    .statusCode(HttpStatus.BAD_REQUEST.value())
                    .time(LocalDateTime.now())
                    .build();
        }
        if (!otpServiceImpl.canRequestOtp(user.getEmail(), OtpType.REGISTRATION)) {
            long remainingSeconds = otpServiceImpl.getRemainingBlockTime(user.getEmail(), OtpType.REGISTRATION);
            throw new RuntimeException("Too many OTP requests. Please try again after " + remainingSeconds + " seconds.");
        }
        otpServiceImpl.invalidateOtp(user.getEmail(), OtpType.REGISTRATION);
        otpServiceImpl.clearVerifiedOtp(user.getEmail(), OtpType.REGISTRATION);
        emailService.sendVerificationEmail(user);
        otpServiceImpl.incrementOtpRequestCount(user.getEmail(), OtpType.REGISTRATION);
        log.info("Registration OTP resent to email: {}", user.getEmail());

        Map<String, Object> response = Map.of(
                "email", user.getEmail(),
                "type", "REGISTRATION",
                "message", "New verification OTP sent successfully."
        );
        return ApiResponse.builder()
                .success(true)
                .message("Verification OTP resent successfully. Please check your email.")
                .data(response)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }
}
