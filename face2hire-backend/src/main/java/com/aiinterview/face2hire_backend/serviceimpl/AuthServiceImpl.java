package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.RegisterRequestDto;
import com.aiinterview.face2hire_backend.dto.RegisterResponse;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.LoginResponse;
import com.aiinterview.face2hire_backend.dto.LoginRequestDto;
import com.aiinterview.face2hire_backend.dto.VerifyOtpRequest;
import com.aiinterview.face2hire_backend.dto.ForgotPasswordRequest;
import com.aiinterview.face2hire_backend.dto.ResetPasswordDto;
import com.aiinterview.face2hire_backend.dto.ResendOtpRequest;
import com.aiinterview.face2hire_backend.entity.OtpType;
import com.aiinterview.face2hire_backend.entity.Role;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.service.AuthService;
import com.aiinterview.face2hire_backend.service.EmailService;
import com.aiinterview.face2hire_backend.service.JwtService;
import com.aiinterview.face2hire_backend.service.OtpService;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import com.aiinterview.face2hire_backend.exception.AccountNotVerifiedException;
import com.aiinterview.face2hire_backend.exception.OtpNotValidException;
import com.aiinterview.face2hire_backend.exception.AlreadyExistsException;
import com.aiinterview.face2hire_backend.exception.PasswordNotMatchException;
import com.aiinterview.face2hire_backend.exception.InvalidCredentialsException;
import com.aiinterview.face2hire_backend.exception.AccountLockedException;
import com.aiinterview.face2hire_backend.exception.UserNotFoundException;



@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ModelMapper modelMapper;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpServiceImpl;
    private final EmailService emailService;

    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @Override
    public ApiResponse<RegisterResponse> register(RegisterRequestDto registerRequest)
            throws MessagingException {
        log.info("Register request for email: {}", registerRequest.getEmail());

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            log.warn("Registration failed – email already exists: {}", registerRequest.getEmail());
            throw new AlreadyExistsException("user with this email: " +
                    registerRequest.getEmail() + " already exists");
        }

        if (userRepository.existsByUserName(registerRequest.getUserName())) {
            log.warn("Registration failed – username already exists: {}",
                    registerRequest.getUserName());
            throw new AlreadyExistsException("user with this username already exists");
        }

        if (!registerRequest.isPasswordMatching()) {
            log.warn("Registration failed – password mismatch for email: {}",
                    registerRequest.getEmail());
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
        log.info("User registered successfully: email={}, username={}, role={}",
                savedUser.getEmail(), savedUser.getUserName(), savedUser.getRole());

        emailService.sendVerificationEmail(savedUser);
        log.info("Verification email sent to: {}", savedUser.getEmail());

        RegisterResponse registerResponse = RegisterResponse.builder()
                .id(savedUser.getId())
                .userName(savedUser.getUserName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .requireVerification(true)
                .build();

        return ApiResponse.<RegisterResponse>builder()
                .message("User registered successfully, " +
                        "Please verify your email with the otp sent to you email")
                .data(registerResponse)
                .success(true)
                .statusCode(HttpStatus.CREATED.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<LoginResponse> login(LoginRequestDto loginRequest)
            throws AccountNotVerifiedException {
        log.info("Login attempt for email: {}", loginRequest.getEmail());

        User user = userRepository.findByEmail(loginRequest.getEmail());
        if (user == null) {
            log.warn("Login failed – user not found: {}", loginRequest.getEmail());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (!user.isVerified()) {
            log.warn("Login failed – account not verified: {}", loginRequest.getEmail());
            throw new AccountNotVerifiedException("Please verify your account");
        }

        if (!user.isActive()) {
            log.warn("Login failed – account locked (admin blocked): {}", loginRequest.getEmail());
            throw new AccountLockedException("your account has been disabled " +
                    "by the admin, please contact admin");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );
        } catch (Exception e) {
            log.warn("Login failed – invalid credentials for email: {}", loginRequest.getEmail());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        log.info("Login successful for email: {}, role: {}", user.getEmail(), user.getRole());

        LoginResponse response = LoginResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .userName(user.getUserName())
                .jwt(accessToken)
                .refreshToken(refreshToken)
                .build();

        return ApiResponse.<LoginResponse>builder()
                .success(true)
                .message("Login successful")
                .data(response)
                .statusCode(200)
                .build();
    }

    @Override
    public ApiResponse<?> verifyUserWithOtp(VerifyOtpRequest verifyOtpRequest)
            throws MessagingException, OtpNotValidException {
        log.info("OTP verification attempt for email: {}", verifyOtpRequest.getEmail());

        User user = userRepository.findByEmail(verifyOtpRequest.getEmail());
        if (user == null) {
            log.warn("OTP verification failed – user not found: {}", verifyOtpRequest.getEmail());
            throw new UserNotFoundException("User not found with email: "
                    + verifyOtpRequest.getEmail());
        }

        if (user.isVerified()) {
            log.warn("OTP verification ignored – account already verified: {}",
                    verifyOtpRequest.getEmail());
            return ApiResponse.builder()
                    .success(false)
                    .message("Account is already verified")
                    .data(null)
                    .statusCode(HttpStatus.BAD_REQUEST.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        boolean isValid = otpServiceImpl.validateOtp(user.getEmail(),
                OtpType.REGISTRATION, verifyOtpRequest.getOtp());
        if (!isValid) {
            log.warn("OTP verification failed – invalid or expired OTP for email: {}",
                    verifyOtpRequest.getEmail());
            throw new OtpNotValidException("Your OTP is incorrect or expired. " +
                    "Please request a new one.");
        }

        user.setVerified(true);
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
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
    public ApiResponse<?> resetPasswordWithOtp(@Valid ForgotPasswordRequest forgotPasswordRequest)
            throws MessagingException {
        log.info("Forgot password request for email: {}", forgotPasswordRequest.getEmail());

        User user = userRepository.findByEmail(forgotPasswordRequest.getEmail());
        if (user == null) {
            log.warn("Forgot password – user not found: {}", forgotPasswordRequest.getEmail());
            throw new UserNotFoundException("User not found with email: " +
                    forgotPasswordRequest.getEmail());
        }

        if (!user.isActive()) {
            log.warn("Forgot password – account inactive for email: {}",
                    forgotPasswordRequest.getEmail());
            throw new RuntimeException("Your account is deactivated. Please contact support.");
        }

        if (user.getRole() == Role.ADMIN) {
            log.warn("Forgot password – admin users cannot reset password via email: {}",
                    forgotPasswordRequest.getEmail());
            throw new AuthorizationDeniedException("you don't have enough rights to " +
                    "perform this operation.");
        }

        if (!otpServiceImpl.canRequestOtp(user.getEmail(), OtpType.FORGOT_PASSWORD)) {
            log.warn("Forgot password – too many OTP requests for email: {}",
                    forgotPasswordRequest.getEmail());
            throw new RuntimeException("Too many OTP requests. Please try again after 15 minutes.");
        }

        emailService.sendForgotPasswordOtp(user);
        log.info("Password reset OTP sent to email: {}", user.getEmail());
        otpServiceImpl.incrementOtpRequestCount(user.getEmail(), OtpType.FORGOT_PASSWORD);
        userRepository.save(user);

        Map<String, Object> response = Map.of("email", user.getEmail());

        return ApiResponse.builder()
                .success(true)
                .message("OTP sent to your email. Please verify to reset password.")
                .data(response)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> verifyOtpForgotPassword(@Valid VerifyOtpRequest request)
            throws OtpNotValidException {
        log.info("Forgot password OTP verification for email: {}", request.getEmail());

        boolean isValid = otpServiceImpl.validateOtp(request.getEmail(),
                OtpType.FORGOT_PASSWORD, request.getOtp());
        if (!isValid) {
            log.warn("Forgot password OTP verification failed for email: {}", request.getEmail());
            throw new OtpNotValidException("Your OTP is incorrect or expired. " +
                    "Please request a new one.");
        }

        otpServiceImpl.markOtpVerified(request.getEmail(), OtpType.FORGOT_PASSWORD);
        log.info("Forgot password OTP verified for email: {}", request.getEmail());

        return ApiResponse.builder()
                .success(true)
                .message("OTP verified successfully. You can now reset your password.")
                .data(null)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> updatePassword(@Valid ResetPasswordDto resetPasswordDto) {
        log.info("Password reset attempt for email: {}", resetPasswordDto.getEmail());

        if (!resetPasswordDto.isMatching()) {
            log.warn("Password reset failed – password mismatch for email: {}",
                    resetPasswordDto.getEmail());
            throw new PasswordNotMatchException("Password and confirm password do not match");
        }

        User user = userRepository.findByEmail(resetPasswordDto.getEmail());
        if (user == null) {
            log.warn("Password reset failed – user not found: {}",
                    resetPasswordDto.getEmail());
            throw new UserNotFoundException("User not found with email: " +
                    resetPasswordDto.getEmail());
        }

        if (!otpServiceImpl.isOtpVerified(resetPasswordDto.getEmail(), OtpType.FORGOT_PASSWORD)) {
            log.warn("Password reset failed – OTP not verified for email: {}",
                    resetPasswordDto.getEmail());
            throw new RuntimeException("Unauthorized: Please complete OTP verification first.");
        }

        if (passwordEncoder.matches(resetPasswordDto.getPassword(), user.getPassword())) {
            log.warn("Password reset failed – new password same as old for email: {}",
                    resetPasswordDto.getEmail());
            throw new RuntimeException("New password cannot be the same as your current password");
        }

        user.setPassword(passwordEncoder.encode(resetPasswordDto.getPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        otpServiceImpl.clearVerifiedOtp(resetPasswordDto.getEmail(), OtpType.FORGOT_PASSWORD);
        otpServiceImpl.invalidateOtp(resetPasswordDto.getEmail(), OtpType.FORGOT_PASSWORD);

        log.info("Password reset successful for email: {}", resetPasswordDto.getEmail());

        return ApiResponse.builder()
                .success(true)
                .message("Password updated successfully. Please login with your new password.")
                .data(null)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public ApiResponse<?> resendOtp(ResendOtpRequest resendOtpRequest) throws MessagingException {
        String email = resendOtpRequest.getEmail();
        OtpType type = resendOtpRequest.getType();
        log.info("Resend OTP request for email: {}, type: {}", email, type);

        User user = userRepository.findByEmail(email);
        if (user == null) {
            log.warn("Resend OTP failed – user not found: {}", email);
            throw new UserNotFoundException("User not found with email: " + email);
        }

        switch (type) {
            case REGISTRATION:
                return resendRegistrationOtp(user);
            case FORGOT_PASSWORD:
                return resendForgotPasswordOtp(user);
            default:
                log.error("Unsupported OTP type: {}", type);
                throw new RuntimeException("Unsupported OTP type: " + type);
        }
    }

    private ApiResponse<?> resendRegistrationOtp(User user) throws MessagingException {
        log.info("Resend registration OTP for email: {}", user.getEmail());

        if (user.isVerified()) {
            log.warn("Resend registration OTP – account already verified: {}", user.getEmail());
            return ApiResponse.builder()
                    .success(false)
                    .message("Account is already verified. Please login.")
                    .data(null)
                    .statusCode(HttpStatus.BAD_REQUEST.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        if (!otpServiceImpl.canRequestOtp(user.getEmail(), OtpType.REGISTRATION)) {
            long remainingSeconds = otpServiceImpl.getRemainingBlockTime(user.getEmail(),
                    OtpType.REGISTRATION);
            log.warn("Resend registration OTP – rate limited for email: {}", user.getEmail());
            throw new RuntimeException("Too many OTP requests. Please try again after " +
                    remainingSeconds + " seconds.");
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

    private ApiResponse<?> resendForgotPasswordOtp(User user) throws MessagingException {
        log.info("Resend forgot password OTP for email: {}", user.getEmail());

        if (!user.isActive()) {
            log.warn("Resend forgot password OTP – account inactive: {}", user.getEmail());
            throw new RuntimeException("Your account is deactivated. Please contact support.");
        }

        if (!otpServiceImpl.canRequestOtp(user.getEmail(), OtpType.FORGOT_PASSWORD)) {
            long remainingSeconds = otpServiceImpl.getRemainingBlockTime(user.getEmail(),
                    OtpType.FORGOT_PASSWORD);
            log.warn("Resend forgot password OTP – rate limited for email: {}", user.getEmail());
            throw new RuntimeException("Too many OTP requests. Please try again after " +
                    remainingSeconds + " seconds.");
        }

        otpServiceImpl.invalidateOtp(user.getEmail(), OtpType.FORGOT_PASSWORD);
        otpServiceImpl.clearVerifiedOtp(user.getEmail(), OtpType.FORGOT_PASSWORD);
        userRepository.save(user);
        emailService.sendForgotPasswordOtp(user);
        otpServiceImpl.incrementOtpRequestCount(user.getEmail(), OtpType.FORGOT_PASSWORD);

        log.info("Forgot password OTP resent to email: {}", user.getEmail());

        Map<String, Object> response = Map.of(
                "email", user.getEmail(),
                "type", "FORGOT_PASSWORD",
                "message", "New password reset OTP sent."
        );

        return ApiResponse.builder()
                .success(true)
                .message("Password reset OTP resent successfully. Please check your email.")
                .data(response)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public Map<String, String> refreshAccessToken(String refreshToken) {
        log.info("Refresh token received: {}", refreshToken);
        try {
            String email = jwtService.extractUsername(refreshToken);
            log.info("Extracted email from refresh token: {}", email);
            User user = userRepository.findByEmail(email);
            if (user == null) {
                log.warn("User not found for refresh token email: {}", email);
                throw new InvalidCredentialsException("Invalid refresh token");
            }
            if (!jwtService.isTokenValid(refreshToken, new CustomUserDetails(user))) {
                log.warn("Refresh token is invalid or expired for user: {}", email);
                throw new InvalidCredentialsException("Refresh token expired or invalid");
            }
            String newAccessToken = jwtService.generateAccessToken(user);
            String newRefreshToken = jwtService.generateRefreshToken(user);
            log.info("New tokens generated for user: {}", email);
            return Map.of("accessToken", newAccessToken, "refreshToken", newRefreshToken);
        } catch (Exception e) {
            log.error("Refresh token error", e);
            throw new InvalidCredentialsException("Invalid refresh token");
        }
    }

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }
}

