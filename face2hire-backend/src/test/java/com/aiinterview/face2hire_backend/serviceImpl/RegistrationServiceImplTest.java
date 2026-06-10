package com.aiinterview.face2hire_backend.serviceImpl;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.RegisterRequestDto;
import com.aiinterview.face2hire_backend.dto.RegisterResponse;
import com.aiinterview.face2hire_backend.dto.ResendOtpRequest;
import com.aiinterview.face2hire_backend.dto.VerifyOtpRequest;
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
import com.aiinterview.face2hire_backend.serviceimpl.RegistrationServiceImpl;
import jakarta.mail.MessagingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private OtpService otpServiceImpl;

    @Mock
    private EmailService emailService;

    @Mock
    private ActivityLogService activityLogService;

    @Mock
    private AppLoggerFactory loggerFactory;

    @Mock
    private AppLogger appLogger;

    @InjectMocks
    private RegistrationServiceImpl registrationService;

    private RegisterRequestDto validRequest;
    private User newUser;
    private User existingVerifiedUser;
    private User existingUnverifiedUser;

    @BeforeEach
    void setUp() {
        lenient().when(loggerFactory.getLogger(any(Class.class))).thenReturn(appLogger);
        registrationService.init();

        validRequest = RegisterRequestDto.builder()
                .userName("john_doe")
                .email("john@example.com")
                .password("Password123!")
                .confirmPassword("Password123!")
                .role(Role.INTERVIEWEE)
                .acceptTermsAndConditions(true)
                .build();

        newUser = User.builder()
                .id(1L)
                .userName("john_doe")
                .email("john@example.com")
                .password("Password123!")
                .role(Role.INTERVIEWEE)
                .isVerified(false)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        existingVerifiedUser = User.builder()
                .id(2L)
                .userName("existing")
                .email("existing@example.com")
                .isVerified(true)
                .build();

        existingUnverifiedUser = User.builder()
                .id(3L)
                .userName("unverified")
                .email("unverified@example.com")
                .isVerified(false)
                .build();
    }


    @Test
    void register_WhenUserExistsAndVerified_ShouldThrowAlreadyExistsException() throws MessagingException {
        when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(existingVerifiedUser);

        assertThrows(AlreadyExistsException.class, () -> registrationService.register(validRequest));
        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendVerificationEmail(any());
    }

    @Test
    void register_WhenUserExistsAndNotVerified_ShouldResendOtpAndReturnResponse() throws MessagingException {
        when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(existingUnverifiedUser);
        when(userRepository.save(any(User.class))).thenReturn(existingUnverifiedUser);
        doNothing().when(otpServiceImpl).invalidateOtp(anyString(), any(OtpType.class));
        doNothing().when(emailService).sendVerificationEmail(any(User.class));

        ApiResponse<RegisterResponse> response = registrationService.register(validRequest);

        assertTrue(response.isSuccess());
        assertEquals("Account already exists but not verified. A new verification OTP has been sent.",
                response.getMessage());
        assertTrue(response.getData().isRequireVerification());

        verify(userRepository).save(existingUnverifiedUser);
        verify(otpServiceImpl).invalidateOtp(existingUnverifiedUser.getEmail(), OtpType.REGISTRATION);
        verify(emailService).sendVerificationEmail(existingUnverifiedUser);
    }

    @Test
    void register_WhenUsernameExists_ShouldThrowAlreadyExistsException() {
        when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(null);
        when(userRepository.existsByUserName(validRequest.getUserName())).thenReturn(true);

        assertThrows(AlreadyExistsException.class, () -> registrationService.register(validRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_WhenPasswordsDoNotMatch_ShouldThrowPasswordNotMatchException() {
        RegisterRequestDto mismatchRequest = RegisterRequestDto.builder()
                .userName("john_doe")
                .email("john@example.com")
                .password("Password123!")
                .confirmPassword("Different123!")
                .role(Role.INTERVIEWEE)
                .build();
        when(userRepository.findByEmail(mismatchRequest.getEmail())).thenReturn(null);
        when(userRepository.existsByUserName(mismatchRequest.getUserName())).thenReturn(false);

        assertThrows(PasswordNotMatchException.class, () -> registrationService.register(mismatchRequest));
    }

    @Test
    void register_WhenNewUser_ShouldCreateAndSendOtp() throws MessagingException {
        when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(null);
        when(userRepository.existsByUserName(validRequest.getUserName())).thenReturn(false);
        when(modelMapper.map(validRequest, User.class)).thenReturn(newUser);
        when(passwordEncoder.encode(validRequest.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(newUser);
        doNothing().when(emailService).sendVerificationEmail(any(User.class));

        ApiResponse<RegisterResponse> response = registrationService.register(validRequest);

        assertTrue(response.isSuccess());
        assertEquals("User registered successfully. Please verify your email with the OTP sent.",
                response.getMessage());

        RegisterResponse data = response.getData();
        assertEquals(1L, data.getId());
        assertEquals("john_doe", data.getUserName());
        assertEquals("john@example.com", data.getEmail());
        assertEquals(Role.INTERVIEWEE, data.getRole());
        assertTrue(data.isRequireVerification());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("encodedPassword", savedUser.getPassword());
        assertFalse(savedUser.isVerified());
        assertTrue(savedUser.isActive());

        verify(emailService).sendVerificationEmail(savedUser);
        verify(activityLogService, never()).log(any(), any(), any());
    }

    @Test
    void verifyUserWithOtp_WhenUserNotFound_ShouldThrowUserNotFoundException() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail("unknown@example.com");
        request.setOtp("123456");
        when(userRepository.findByEmail(request.getEmail())).thenReturn(null);

        assertThrows(UserNotFoundException.class, () -> registrationService.verifyUserWithOtp(request));
    }

    @Test
    void verifyUserWithOtp_WhenAlreadyVerified_ShouldReturnFailureResponse() throws MessagingException, OtpNotValidException {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail(existingVerifiedUser.getEmail());
        request.setOtp("123456");
        when(userRepository.findByEmail(request.getEmail())).thenReturn(existingVerifiedUser);

        ApiResponse<?> response = registrationService.verifyUserWithOtp(request);

        assertFalse(response.isSuccess());
        assertEquals("Account is already verified", response.getMessage());
        verify(otpServiceImpl, never()).validateOtp(anyString(), any(), anyString());
    }

    @Test
    void verifyUserWithOtp_WhenOtpInvalid_ShouldThrowOtpNotValidException() {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail(existingUnverifiedUser.getEmail());
        request.setOtp("wrong");
        when(userRepository.findByEmail(request.getEmail())).thenReturn(existingUnverifiedUser);
        when(otpServiceImpl.validateOtp(existingUnverifiedUser.getEmail(), OtpType.REGISTRATION, request.getOtp()))
                .thenReturn(false);

        assertThrows(OtpNotValidException.class, () -> registrationService.verifyUserWithOtp(request));
    }

    @Test
    void verifyUserWithOtp_WhenValid_ShouldVerifyAndLogActivity() throws MessagingException, OtpNotValidException {
        VerifyOtpRequest request = new VerifyOtpRequest();
        request.setEmail(existingUnverifiedUser.getEmail());
        request.setOtp("123456");
        when(userRepository.findByEmail(request.getEmail())).thenReturn(existingUnverifiedUser);
        when(otpServiceImpl.validateOtp(existingUnverifiedUser.getEmail(), OtpType.REGISTRATION, request.getOtp()))
                .thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(existingUnverifiedUser);

        ApiResponse<?> response = registrationService.verifyUserWithOtp(request);

        assertTrue(response.isSuccess());
        assertEquals("Verification successful! You can now login.", response.getMessage());
        assertTrue(existingUnverifiedUser.isVerified());

        verify(userRepository).save(existingUnverifiedUser);
        verify(activityLogService).log(existingUnverifiedUser, ActivityAction.REGISTER,
                "User registered and verified email");
    }


    @Test
    void resendRegistrationOtp_WhenUserNotFound_ShouldThrowUserNotFoundException() {
        ResendOtpRequest request = new ResendOtpRequest();
        request.setEmail("unknown@example.com");
        when(userRepository.findByEmail(request.getEmail())).thenReturn(null);

        assertThrows(UserNotFoundException.class, () -> registrationService.resendRegistrationOtp(request));
    }

    @Test
    void resendRegistrationOtp_WhenAlreadyVerified_ShouldReturnFailureResponse() throws MessagingException {
        ResendOtpRequest request = new ResendOtpRequest();
        request.setEmail(existingVerifiedUser.getEmail());
        when(userRepository.findByEmail(request.getEmail())).thenReturn(existingVerifiedUser);

        ApiResponse<?> response = registrationService.resendRegistrationOtp(request);

        assertFalse(response.isSuccess());
        assertEquals("Account is already verified. Please login.", response.getMessage());
        verify(otpServiceImpl, never()).canRequestOtp(anyString(), any());
    }

    @Test
    void resendRegistrationOtp_WhenRateLimitExceeded_ShouldThrowRuntimeException() {
        ResendOtpRequest request = new ResendOtpRequest();
        request.setEmail(existingUnverifiedUser.getEmail());
        when(userRepository.findByEmail(request.getEmail())).thenReturn(existingUnverifiedUser);
        when(otpServiceImpl.canRequestOtp(existingUnverifiedUser.getEmail(), OtpType.REGISTRATION))
                .thenReturn(false);
        when(otpServiceImpl.getRemainingBlockTime(existingUnverifiedUser.getEmail(), OtpType.REGISTRATION))
                .thenReturn(30L);

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> registrationService.resendRegistrationOtp(request));
        assertTrue(exception.getMessage().contains("Too many OTP requests"));
    }

    @Test
    void resendRegistrationOtp_WhenValid_ShouldResendOtpAndReturnSuccess() throws MessagingException {
        ResendOtpRequest request = new ResendOtpRequest();
        request.setEmail(existingUnverifiedUser.getEmail());
        when(userRepository.findByEmail(request.getEmail())).thenReturn(existingUnverifiedUser);
        when(otpServiceImpl.canRequestOtp(existingUnverifiedUser.getEmail(), OtpType.REGISTRATION))
                .thenReturn(true);
        doNothing().when(otpServiceImpl).invalidateOtp(anyString(), any());
        doNothing().when(otpServiceImpl).clearVerifiedOtp(anyString(), any());
        doNothing().when(emailService).sendVerificationEmail(any(User.class));
        doNothing().when(otpServiceImpl).incrementOtpRequestCount(anyString(), any());

        ApiResponse<?> response = registrationService.resendRegistrationOtp(request);

        assertTrue(response.isSuccess());
        assertEquals("Verification OTP resent successfully. Please check your email.", response.getMessage());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(existingUnverifiedUser.getEmail(), data.get("email"));
        assertEquals("REGISTRATION", data.get("type"));

        verify(otpServiceImpl).invalidateOtp(existingUnverifiedUser.getEmail(), OtpType.REGISTRATION);
        verify(otpServiceImpl).clearVerifiedOtp(existingUnverifiedUser.getEmail(), OtpType.REGISTRATION);
        verify(emailService).sendVerificationEmail(existingUnverifiedUser);
        verify(otpServiceImpl).incrementOtpRequestCount(existingUnverifiedUser.getEmail(), OtpType.REGISTRATION);
    }
}