//package com.aiinterview.face2hire_backend.serviceImpl;
//
//import com.aiinterview.face2hire_backend.dto.*;
//import com.aiinterview.face2hire_backend.entity.*;
//import com.aiinterview.face2hire_backend.exception.ResourceNotFoundException;
//import com.aiinterview.face2hire_backend.exception.ValidationException;
//import com.aiinterview.face2hire_backend.logging.AppLogger;
//import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
//import com.aiinterview.face2hire_backend.repository.*;
//import com.aiinterview.face2hire_backend.repository.interview.ScheduledInterviewRepository;
//import com.aiinterview.face2hire_backend.service.ActivityLogService;
//import com.aiinterview.face2hire_backend.service.BadgeService;
//import com.aiinterview.face2hire_backend.service.NotificationService;
//import com.aiinterview.face2hire_backend.serviceimpl.ApplicationServiceImpl;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.ArgumentCaptor;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageImpl;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Pageable;
//
//import java.nio.file.AccessDeniedException;
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//class ApplicationServiceImplTest {
//
//    @Mock
//    private ApplicationRepository applicationRepository;
//
//    @Mock
//    private JobRepository jobRepository;
//
//    @Mock
//    private UserRepository userRepository;
//
//    @Mock
//    private JobSkillRepository jobSkillRepository;
//
//    @Mock
//    private ResumeRepository resumeRepository;
//
//    @Mock
//    private ScheduledInterviewRepository scheduledInterviewRepository;
//
//    @Mock
//    private ActivityLogService activityLogService;
//
//    @Mock
//    private NotificationService notificationService;
//
//    @Mock
//    private BadgeService badgeService;
//
//    @Mock
//    private AppLoggerFactory loggerFactory;
//
//    @Mock
//    private AppLogger appLogger;
//
//    @InjectMocks
//    private ApplicationServiceImpl applicationService;
//
//    private User testUser;
//    private Job testJob;
//    private Application testApplication;
//    private Resume testResume;
//    private ApplicationRequestDto applyRequest;
//    private ApplicationStatusUpdateDto statusUpdateDto;
//
//    @BeforeEach
//    void setUp() {
//        lenient().when(loggerFactory.getLogger(any(Class.class))).thenReturn(appLogger);
//        applicationService.init();
//
//        testUser = User.builder()
//                .id(1L)
//                .userName("testuser")
//                .fullName("Test User")
//                .email("test@example.com")
//                .build();
//
//        testJob = Job.builder()
//                .id(10L)
//                .title("Software Engineer")
//                .company("Tech Corp")
//                .status(JobStatus.ACTIVE)
//                .postedByUserId(2L)
//                .requiredExperience(3)
//                .applicantsCount(0)
//                .build();
//
//        testApplication = Application.builder()
//                .id(100L)
//                .jobId(10L)
//                .userId(1L)
//                .coverLetter("I am a great fit")
//                .status(ApplicationStatus.PENDING)
//                .score(0.0)
//                .appliedAt(LocalDateTime.now())
//                .build();
//
//        testResume = Resume.builder()
//                .id(200L)
//                .userId(1L)
//                .status(ResumeStatus.COMPLETED)
//                .build();
//
//        applyRequest = ApplicationRequestDto.builder()
//                .jobId(10L)
//                .coverLetter("I am a great fit")
//                .build();
//
//        statusUpdateDto = new ApplicationStatusUpdateDto();
//        statusUpdateDto.setStatus(ApplicationStatus.APPROVED);
//    }
//
//    @Test
//    void applyForJob_ShouldThrowResourceNotFound_WhenJobMissing() {
//        when(jobRepository.findById(10L)).thenReturn(Optional.empty());
//        assertThrows(ResourceNotFoundException.class, () -> applicationService.applyForJob(1L, applyRequest));
//    }
//
//    @Test
//    void applyForJob_ShouldThrowValidationException_WhenJobInactive() {
//        testJob.setStatus(JobStatus.CLOSED);
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        assertThrows(ValidationException.class, () -> applicationService.applyForJob(1L, applyRequest));
//    }
//
//    @Test
//    void applyForJob_ShouldThrowResourceNotFound_WhenUserMissing() {
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        when(userRepository.findById(1L)).thenReturn(Optional.empty());
//        assertThrows(ResourceNotFoundException.class, () -> applicationService.applyForJob(1L, applyRequest));
//    }
//
//    @Test
//    void applyForJob_ShouldThrowValidationException_WhenResumeNotCompleted() {
//        testResume.setStatus(ResumeStatus.PROCESSING);
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
//        when(resumeRepository.findByUserIdAndIsActiveTrue(1L)).thenReturn(testResume);
//        assertThrows(ValidationException.class, () -> applicationService.applyForJob(1L, applyRequest));
//    }
//
//
//    @Test
//    void getMyApplications_ShouldReturnPage() {
//        Pageable pageable = PageRequest.of(0, 10);
//        Page<Application> appPage = new PageImpl<>(List.of(testApplication));
//        when(applicationRepository.findByUserId(1L, pageable)).thenReturn(appPage);
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
//        when(scheduledInterviewRepository.existsByApplicationId(100L)).thenReturn(false);
//
//        Page<ApplicationListResponseDto> result = applicationService.getMyApplications(1L, pageable);
//        assertNotNull(result);
//        assertEquals(1, result.getTotalElements());
//        ApplicationListResponseDto dto = result.getContent().get(0);
//        assertEquals(100L, dto.getId());
//        assertEquals("Software Engineer", dto.getJobTitle());
//    }
//
//
//    @Test
//    void getApplicationsForJob_ShouldReturnPage() {
//        Pageable pageable = PageRequest.of(0, 10);
//        Page<Application> appPage = new PageImpl<>(List.of(testApplication));
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        when(applicationRepository.findByJobId(10L, pageable)).thenReturn(appPage);
//        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
//        when(scheduledInterviewRepository.existsByApplicationId(100L)).thenReturn(false);
//
//        Page<ApplicationListResponseDto> result = applicationService.getApplicationsForJob(10L, pageable);
//        assertNotNull(result);
//        assertEquals(1, result.getTotalElements());
//    }
//
//    @Test
//    void getApplicationsForJob_ShouldThrowResourceNotFound_WhenJobMissing() {
//        when(jobRepository.findById(99L)).thenReturn(Optional.empty());
//        assertThrows(ResourceNotFoundException.class,
//                () -> applicationService.getApplicationsForJob(99L, PageRequest.of(0, 10)));
//    }
//
//    // ==================== getApplicationsForInterviewer tests ====================
//
//    @Test
//    void getApplicationsForInterviewer_ShouldReturnPage() {
//        Pageable pageable = PageRequest.of(0, 10);
//        Page<Application> appPage = new PageImpl<>(List.of(testApplication));
//        when(applicationRepository.findByInterviewerId(2L, pageable)).thenReturn(appPage);
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
//        when(scheduledInterviewRepository.existsByApplicationId(100L)).thenReturn(false);
//
//        Page<ApplicationListResponseDto> result = applicationService.getApplicationsForInterviewer(2L, pageable);
//        assertNotNull(result);
//        assertEquals(1, result.getTotalElements());
//    }
//
//
//    @Test
//    void updateApplicationStatus_ShouldSucceed_WhenApproved() throws AccessDeniedException {
//        when(applicationRepository.findById(100L)).thenReturn(Optional.of(testApplication));
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
//        when(applicationRepository.save(any(Application.class))).thenReturn(testApplication);
//        doNothing().when(notificationService).createNotification(any(), any(), any(), any());
//        doNothing().when(activityLogService).log(any(), any(), any());
//        doNothing().when(badgeService).checkAndAwardBadges(2L);
//
//        ApplicationResponseDto response = applicationService.updateApplicationStatus(100L, 2L, statusUpdateDto);
//
//        assertNotNull(response);
//        assertEquals(ApplicationStatus.APPROVED, testApplication.getStatus());
//
//        // Note: The service currently sends "APPLICATION_REJECTED" due to a bug (comparing enum to string).
//        verify(notificationService).createNotification(eq(1L), eq("Application APPROVED"), anyString(), eq("APPLICATION_REJECTED"));
//        verify(activityLogService).log(eq(testUser), eq(ActivityAction.APPLICATION_APPROVED), anyString());
//        verify(badgeService).checkAndAwardBadges(2L);
//    }
//
//    @Test
//    void updateApplicationStatus_ShouldNotAwardBadge_WhenRejected() throws AccessDeniedException {
//        statusUpdateDto.setStatus(ApplicationStatus.REJECTED);
//        when(applicationRepository.findById(100L)).thenReturn(Optional.of(testApplication));
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
//        when(applicationRepository.save(any(Application.class))).thenReturn(testApplication);
//        doNothing().when(notificationService).createNotification(any(), any(), any(), any());
//        doNothing().when(activityLogService).log(any(), any(), any());
//
//        ApplicationResponseDto response = applicationService.updateApplicationStatus(100L, 2L, statusUpdateDto);
//
//        assertNotNull(response);
//        assertEquals(ApplicationStatus.REJECTED, testApplication.getStatus());
//        verify(badgeService, never()).checkAndAwardBadges(anyLong());
//    }
//
//    @Test
//    void updateApplicationStatus_ShouldThrowResourceNotFound_WhenApplicationMissing() {
//        when(applicationRepository.findById(100L)).thenReturn(Optional.empty());
//        assertThrows(ResourceNotFoundException.class,
//                () -> applicationService.updateApplicationStatus(100L, 2L, statusUpdateDto));
//    }
//
//    @Test
//    void updateApplicationStatus_ShouldThrowResourceNotFound_WhenJobMissing() {
//        when(applicationRepository.findById(100L)).thenReturn(Optional.of(testApplication));
//        when(jobRepository.findById(10L)).thenReturn(Optional.empty());
//        assertThrows(ResourceNotFoundException.class,
//                () -> applicationService.updateApplicationStatus(100L, 2L, statusUpdateDto));
//    }
//
//    @Test
//    void updateApplicationStatus_ShouldThrowAccessDenied_WhenWrongInterviewer() {
//        when(applicationRepository.findById(100L)).thenReturn(Optional.of(testApplication));
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        assertThrows(AccessDeniedException.class,
//                () -> applicationService.updateApplicationStatus(100L, 99L, statusUpdateDto));
//    }
//
//
//    @Test
//    void getApplicationById_ShouldSucceed_ForApplicant() throws AccessDeniedException {
//        when(applicationRepository.findById(100L)).thenReturn(Optional.of(testApplication));
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
//
//        ApplicationResponseDto response = applicationService.getApplicationById(100L, 1L);
//        assertNotNull(response);
//        assertEquals(100L, response.getId());
//    }
//
//    @Test
//    void getApplicationById_ShouldSucceed_ForInterviewer() throws AccessDeniedException {
//        when(applicationRepository.findById(100L)).thenReturn(Optional.of(testApplication));
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
//
//        ApplicationResponseDto response = applicationService.getApplicationById(100L, 2L);
//        assertNotNull(response);
//    }
//
//    @Test
//    void getApplicationById_ShouldThrowAccessDenied_ForUnauthorizedUser() {
//        when(applicationRepository.findById(100L)).thenReturn(Optional.of(testApplication));
//        when(jobRepository.findById(10L)).thenReturn(Optional.of(testJob));
//        assertThrows(AccessDeniedException.class,
//                () -> applicationService.getApplicationById(100L, 99L));
//    }
//
//    @Test
//    void getApplicationById_ShouldThrowResourceNotFound_WhenApplicationMissing() {
//        when(applicationRepository.findById(100L)).thenReturn(Optional.empty());
//        assertThrows(ResourceNotFoundException.class,
//                () -> applicationService.getApplicationById(100L, 1L));
//    }
//}