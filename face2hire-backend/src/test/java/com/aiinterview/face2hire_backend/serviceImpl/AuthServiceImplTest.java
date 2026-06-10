package com.aiinterview.face2hire_backend.serviceImpl;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.entity.OtpType;
import com.aiinterview.face2hire_backend.entity.Role;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.exception.*;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.service.EmailService;
import com.aiinterview.face2hire_backend.service.JwtService;
import com.aiinterview.face2hire_backend.service.OtpService;
import com.aiinterview.face2hire_backend.serviceimpl.AuthServiceImpl;
import jakarta.mail.MessagingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private OtpService otpServiceImpl;

    @Mock
    private EmailService emailService;

    @Mock
    private AppLoggerFactory loggerFactory;

    @Mock
    private AppLogger appLogger;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private LoginRequestDto loginRequest;
    private ForgotPasswordRequest forgotRequest;
    private VerifyOtpRequest verifyOtpRequest;
    private ResetPasswordDto resetPasswordDto;
    private ResendOtpRequest resendOtpRequest;

    @BeforeEach
    void setUp() {
        lenient().when(loggerFactory.getLogger(any(Class.class))).thenReturn(appLogger);
        authService.init();

        testUser = User.builder()
                .id(1L)
                .userName("testuser")
                .email("test@example.com")
                .password("encodedPass")
                .role(Role.INTERVIEWEE)
                .isVerified(true)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        loginRequest = LoginRequestDto.builder()
                .email("test@example.com")
                .password("rawPass")
                .build();

        forgotRequest = new ForgotPasswordRequest();
        forgotRequest.setEmail("test@example.com");

        verifyOtpRequest = new VerifyOtpRequest();
        verifyOtpRequest.setEmail("test@example.com");
        verifyOtpRequest.setOtp("123456");

        resetPasswordDto = ResetPasswordDto.builder()
                .email("test@example.com")
                .password("NewPass123!")
                .confirmPassword("NewPass123!")
                .build();

        resendOtpRequest = new ResendOtpRequest();
        resendOtpRequest.setEmail("test@example.com");
        resendOtpRequest.setType(OtpType.REGISTRATION);
    }


    @Test
    void login_ShouldSucceed_WhenValidCredentials() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(testUser);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mock(Authentication.class));
        when(jwtService.generateAccessToken(testUser)).thenReturn("accessToken");
        when(jwtService.generateRefreshToken(testUser)).thenReturn("refreshToken");

        ApiResponse<LoginResponse> response = authService.login(loginRequest);

        assertTrue(response.isSuccess());
        assertEquals("Login successful", response.getMessage());
        LoginResponse data = response.getData();
        assertEquals(1L, data.getId());
        assertEquals("test@example.com", data.getEmail());
        assertEquals(Role.INTERVIEWEE, data.getRole());
        assertEquals("testuser", data.getUserName());
        assertEquals("accessToken", data.getJwt());
        assertEquals("refreshToken", data.getRefreshToken());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertNotNull(savedUser.getLastLoginAt(), "lastLoginAt should be set");
    }

    @Test
    void login_ShouldThrowInvalidCredentials_WhenUserNotFound() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(null);
        assertThrows(InvalidCredentialsException.class, () -> authService.login(loginRequest));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void login_ShouldThrowAccountNotVerified_WhenUserNotVerified() {
        testUser.setVerified(false);
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(testUser);
        assertThrows(AccountNotVerifiedException.class, () -> authService.login(loginRequest));
    }

    @Test
    void login_ShouldThrowAccountLocked_WhenUserInactive() {
        testUser.setActive(false);
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(testUser);
        assertThrows(AccountLockedException.class, () -> authService.login(loginRequest));
    }

    @Test
    void login_ShouldThrowInvalidCredentials_WhenAuthenticationFails() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(testUser);
        doThrow(new RuntimeException()).when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));
        assertThrows(InvalidCredentialsException.class, () -> authService.login(loginRequest));
    }


    @Test
    void resetPasswordWithOtp_ShouldSendOtp_WhenValid() throws MessagingException {
        when(userRepository.findByEmail(forgotRequest.getEmail())).thenReturn(testUser);
        when(otpServiceImpl.canRequestOtp(testUser.getEmail(), OtpType.FORGOT_PASSWORD)).thenReturn(true);
        doNothing().when(emailService).sendForgotPasswordOtp(testUser);
        doNothing().when(otpServiceImpl).incrementOtpRequestCount(testUser.getEmail(), OtpType.FORGOT_PASSWORD);

        ApiResponse<?> response = authService.resetPasswordWithOtp(forgotRequest);
        assertTrue(response.isSuccess());
        assertEquals("OTP sent to your email. Please verify to reset password.", response.getMessage());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(testUser.getEmail(), data.get("email"));
        verify(emailService).sendForgotPasswordOtp(testUser);
        verify(otpServiceImpl).incrementOtpRequestCount(testUser.getEmail(), OtpType.FORGOT_PASSWORD);
    }

    @Test
    void resetPasswordWithOtp_ShouldThrowUserNotFound_WhenEmailMissing() {
        when(userRepository.findByEmail(forgotRequest.getEmail())).thenReturn(null);
        assertThrows(UserNotFoundException.class, () -> authService.resetPasswordWithOtp(forgotRequest));
    }

    @Test
    void resetPasswordWithOtp_ShouldThrowRuntimeException_WhenUserInactive() {
        testUser.setActive(false);
        when(userRepository.findByEmail(forgotRequest.getEmail())).thenReturn(testUser);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.resetPasswordWithOtp(forgotRequest));
        assertTrue(ex.getMessage().contains("deactivated"));
    }

    @Test
    void resetPasswordWithOtp_ShouldThrowRuntimeException_WhenRateLimitExceeded() {
        when(userRepository.findByEmail(forgotRequest.getEmail())).thenReturn(testUser);
        when(otpServiceImpl.canRequestOtp(testUser.getEmail(), OtpType.FORGOT_PASSWORD)).thenReturn(false);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.resetPasswordWithOtp(forgotRequest));
        assertTrue(ex.getMessage().contains("Too many OTP requests"));
    }


    @Test
    void verifyOtpForgotPassword_ShouldSucceed_WhenOtpValid() throws OtpNotValidException {
        when(otpServiceImpl.validateOtp(verifyOtpRequest.getEmail(), OtpType.FORGOT_PASSWORD, verifyOtpRequest.getOtp()))
                .thenReturn(true);
        doNothing().when(otpServiceImpl).markOtpVerified(verifyOtpRequest.getEmail(), OtpType.FORGOT_PASSWORD);
        ApiResponse<?> response = authService.verifyOtpForgotPassword(verifyOtpRequest);
        assertTrue(response.isSuccess());
        assertEquals("OTP verified successfully. You can now reset your password.", response.getMessage());
        verify(otpServiceImpl).markOtpVerified(verifyOtpRequest.getEmail(), OtpType.FORGOT_PASSWORD);
    }

    @Test
    void verifyOtpForgotPassword_ShouldThrowOtpNotValid_WhenOtpInvalid() {
        when(otpServiceImpl.validateOtp(verifyOtpRequest.getEmail(), OtpType.FORGOT_PASSWORD, verifyOtpRequest.getOtp()))
                .thenReturn(false);
        assertThrows(OtpNotValidException.class, () -> authService.verifyOtpForgotPassword(verifyOtpRequest));
    }

    @Test
    void updatePassword_ShouldSucceed_WhenValid() {
        when(userRepository.findByEmail(resetPasswordDto.getEmail())).thenReturn(testUser);
        when(otpServiceImpl.isOtpVerified(resetPasswordDto.getEmail(), OtpType.FORGOT_PASSWORD)).thenReturn(true);
        when(passwordEncoder.matches(resetPasswordDto.getPassword(), testUser.getPassword())).thenReturn(false);
        when(passwordEncoder.encode(resetPasswordDto.getPassword())).thenReturn("newEncoded");
        doNothing().when(otpServiceImpl).clearVerifiedOtp(resetPasswordDto.getEmail(), OtpType.FORGOT_PASSWORD);
        doNothing().when(otpServiceImpl).invalidateOtp(resetPasswordDto.getEmail(), OtpType.FORGOT_PASSWORD);

        ApiResponse<?> response = authService.updatePassword(resetPasswordDto);
        assertTrue(response.isSuccess());
        assertEquals("Password updated successfully. Please login with your new password.", response.getMessage());
        verify(userRepository).save(testUser);
        assertEquals("newEncoded", testUser.getPassword());
    }

    @Test
    void updatePassword_ShouldThrowPasswordNotMatch_WhenPasswordsDiffer() {
        resetPasswordDto.setConfirmPassword("different");
        assertThrows(PasswordNotMatchException.class, () -> authService.updatePassword(resetPasswordDto));
    }

    @Test
    void updatePassword_ShouldThrowUserNotFound_WhenEmailMissing() {
        when(userRepository.findByEmail(resetPasswordDto.getEmail())).thenReturn(null);
        assertThrows(UserNotFoundException.class, () -> authService.updatePassword(resetPasswordDto));
    }

    @Test
    void updatePassword_ShouldThrowRuntimeException_WhenOtpNotVerified() {
        when(userRepository.findByEmail(resetPasswordDto.getEmail())).thenReturn(testUser);
        when(otpServiceImpl.isOtpVerified(resetPasswordDto.getEmail(), OtpType.FORGOT_PASSWORD)).thenReturn(false);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.updatePassword(resetPasswordDto));
        assertTrue(ex.getMessage().contains("OTP verification"));
    }

    @Test
    void updatePassword_ShouldThrowRuntimeException_WhenNewPasswordSameAsOld() {
        when(userRepository.findByEmail(resetPasswordDto.getEmail())).thenReturn(testUser);
        when(otpServiceImpl.isOtpVerified(resetPasswordDto.getEmail(), OtpType.FORGOT_PASSWORD)).thenReturn(true);
        when(passwordEncoder.matches(resetPasswordDto.getPassword(), testUser.getPassword())).thenReturn(true);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.updatePassword(resetPasswordDto));
        assertTrue(ex.getMessage().contains("cannot be the same"));
    }


    @Test
    void resendOtp_ForRegistration_ShouldSucceed() throws MessagingException {
        resendOtpRequest.setType(OtpType.REGISTRATION);
        User unverifiedUser = User.builder()
                .email("test@example.com")
                .isVerified(false)
                .build();
        when(userRepository.findByEmail(resendOtpRequest.getEmail())).thenReturn(unverifiedUser);
        when(otpServiceImpl.canRequestOtp(unverifiedUser.getEmail(), OtpType.REGISTRATION)).thenReturn(true);
        doNothing().when(otpServiceImpl).invalidateOtp(anyString(), any());
        doNothing().when(otpServiceImpl).clearVerifiedOtp(anyString(), any());
        doNothing().when(emailService).sendVerificationEmail(any(User.class));
        doNothing().when(otpServiceImpl).incrementOtpRequestCount(anyString(), any());

        ApiResponse<?> response = authService.resendOtp(resendOtpRequest);
        assertTrue(response.isSuccess());
        assertEquals("Verification OTP resent successfully. Please check your email.", response.getMessage());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("test@example.com", data.get("email"));
        assertEquals("REGISTRATION", data.get("type"));
    }

    @Test
    void resendOtp_ForForgotPassword_ShouldSucceed() throws MessagingException {
        resendOtpRequest.setType(OtpType.FORGOT_PASSWORD);
        when(userRepository.findByEmail(resendOtpRequest.getEmail())).thenReturn(testUser);
        when(otpServiceImpl.canRequestOtp(testUser.getEmail(), OtpType.FORGOT_PASSWORD)).thenReturn(true);
        doNothing().when(otpServiceImpl).invalidateOtp(anyString(), any());
        doNothing().when(otpServiceImpl).clearVerifiedOtp(anyString(), any());
        doNothing().when(emailService).sendForgotPasswordOtp(any(User.class));
        doNothing().when(otpServiceImpl).incrementOtpRequestCount(anyString(), any());

        ApiResponse<?> response = authService.resendOtp(resendOtpRequest);
        assertTrue(response.isSuccess());
        assertEquals("Password reset OTP resent successfully. Please check your email.", response.getMessage());
    }

    @Test
    void resendOtp_ShouldThrowUserNotFound_WhenEmailMissing() {
        when(userRepository.findByEmail(resendOtpRequest.getEmail())).thenReturn(null);
        assertThrows(UserNotFoundException.class, () -> authService.resendOtp(resendOtpRequest));
    }

    // ==================== refreshAccessToken() tests ====================

    @Test
    void refreshAccessToken_ShouldReturnNewTokens_WhenValid() {
        String refreshToken = "validRefreshToken";
        String email = "test@example.com";
        when(jwtService.extractUsername(refreshToken)).thenReturn(email);
        when(userRepository.findByEmail(email)).thenReturn(testUser);
        when(jwtService.isTokenValid(refreshToken, new CustomUserDetails(testUser))).thenReturn(true);
        when(jwtService.generateAccessToken(testUser)).thenReturn("newAccessToken");
        when(jwtService.generateRefreshToken(testUser)).thenReturn("newRefreshToken");

        Map<String, String> tokens = authService.refreshAccessToken(refreshToken);
        assertEquals("newAccessToken", tokens.get("accessToken"));
        assertEquals("newRefreshToken", tokens.get("refreshToken"));
    }

    @Test
    void refreshAccessToken_ShouldThrowInvalidCredentials_WhenUserNotFound() {
        String refreshToken = "token";
        when(jwtService.extractUsername(refreshToken)).thenReturn("unknown@example.com");
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(null);
        assertThrows(InvalidCredentialsException.class, () -> authService.refreshAccessToken(refreshToken));
    }

    @Test
    void refreshAccessToken_ShouldThrowInvalidCredentials_WhenTokenInvalid() {
        String refreshToken = "token";
        when(jwtService.extractUsername(refreshToken)).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(testUser);
        when(jwtService.isTokenValid(refreshToken, new CustomUserDetails(testUser))).thenReturn(false);
        assertThrows(InvalidCredentialsException.class, () -> authService.refreshAccessToken(refreshToken));
    }
}