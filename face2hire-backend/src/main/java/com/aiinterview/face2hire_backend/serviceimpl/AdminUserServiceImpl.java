package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.entity.*;
import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import com.aiinterview.face2hire_backend.exception.UserNotFoundException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.ExperienceRepository;
import com.aiinterview.face2hire_backend.repository.ResumeRepository;
import com.aiinterview.face2hire_backend.repository.SkillRepository;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.service.AdminUserService;
import com.aiinterview.face2hire_backend.service.S3Service;
import com.aiinterview.face2hire_backend.specification.UserSpecification;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final SkillRepository skillRepository;
    private final ExperienceRepository experienceRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final S3Service s3Service;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @Override
    public Page<UserListResponseDto> getFilteredUsersDto(UserFilterRequest filter) {
        log.info("Fetching users with filters - search: {}, role: {}, active: {}, page: {}, size: {}",
                filter.getSearch(), filter.getRole(), filter.getIsActive(), filter.getPage(), filter.getSize());
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage = userRepository.findAll(
                UserSpecification.filterBy(filter.getSearch(), filter.getRole(), filter.getIsActive()),
                pageable
        );
        log.info("Found {} users out of {} total", userPage.getNumberOfElements(), userPage.getTotalElements());
        return userPage.map(user -> UserListResponseDto.builder()
                .id(user.getId())
                .userName(user.getUserName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .isActive(user.isActive())
                .isVerified(user.isVerified())
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build());
    }

    @Override
    public ApiResponse<?> blockUser(Long userId) {
        log.info("Attempting to block user with id: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found with id: {}", userId);
                    return new UserNotFoundException("User not found with id: " + userId);
                });

        if (!user.isActive()) {
            log.warn("User {} is already blocked", userId);
            return ApiResponse.builder()
                    .success(false)
                    .message("User is already blocked")
                    .statusCode(HttpStatus.BAD_REQUEST.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        user.setActive(false);
        userRepository.save(user);
        log.info("User {} successfully blocked", userId);

        return ApiResponse.builder()
                .statusCode(HttpStatus.OK.value())
                .success(true)
                .message("User account successfully blocked")
                .time(LocalDateTime.now())
                .data(null)
                .build();
    }

    @Override
    public ApiResponse<?> unBlockUser(Long userId) {
        log.info("Attempting to unblock user with id: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found with id: {}", userId);
                    return new UserNotFoundException("User not found with id: " + userId);
                });

        if (user.isActive()) {
            log.warn("User {} is already active", userId);
            return ApiResponse.builder()
                    .success(false)
                    .message("User is already unblocked")
                    .statusCode(HttpStatus.BAD_REQUEST.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        user.setActive(true);
        userRepository.save(user);
        log.info("User {} successfully unblocked", userId);

        return ApiResponse.builder()
                .statusCode(HttpStatus.OK.value())
                .success(true)
                .message("User account successfully unlocked")
                .time(LocalDateTime.now())
                .data(null)
                .build();
    }

    @Override
    public ApiResponse<AdminStatsDto> getAdminStats() {
        log.info("Retrieving admin dashboard statistics");
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActive(true);
        long totalInterviews = interviewSessionRepository.countByStatus(SessionStatus.COMPLETED);
        long premiumUsers = 0;

        log.info("Statistics calculated: totalUsers={}, activeUsers={}, totalInterviews={}, premiumUsers={}",
                totalUsers, activeUsers, totalInterviews, premiumUsers);

        AdminStatsDto stats = AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalInterviews(totalInterviews)
                .premiumUsers(premiumUsers)
                .build();

        return ApiResponse.<AdminStatsDto>builder()
                .success(true)
                .message("Statistics retrieved")
                .data(stats)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
    }

    @Override
    public List<InterviewVolumeDto> getInterviewVolumeByType() {
        log.info("Retrieving interview volume by type");
        List<Object[]> results = interviewSessionRepository.countCompletedInterviewsByType();
        return results.stream()
                .map(row -> InterviewVolumeDto.builder()
                        .type(((InterviewType) row[0]).name().toLowerCase())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }


    @Override
    public List<UserGrowthDto> getUserGrowth() {
        log.info("Retrieving user growth data");
        List<Object[]> results = userRepository.countUsersByMonth();
        List<UserGrowthDto> growth = results.stream()
                .map(row -> UserGrowthDto.builder()
                        .month((String) row[0])
                        .users(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
        log.info("User growth data retrieved: {} months", growth.size());
        return growth;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDetailResponseDto getUserDetailForAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        Resume activeResume = resumeRepository.findByUserIdAndIsActiveTrue(userId);
        AdminUserDetailResponseDto.ResumeInfo resumeInfo = null;
        if (activeResume != null && activeResume.getStatus() == ResumeStatus.COMPLETED) {
            List<Skill> skills = skillRepository.findByResumeId(activeResume.getId());
            List<Experience> experiences = experienceRepository.findByResumeId(activeResume.getId());
            resumeInfo = AdminUserDetailResponseDto.ResumeInfo.builder()
                    .resumeId(activeResume.getId())
                    .fileName(extractFileName(activeResume.getFileKey()))
                    .fileUrl(s3Service.generatePresignedUrlForDownload(activeResume.getFileKey()))
                    .uploadedAt(activeResume.getUploadedAt())
                    .status(activeResume.getStatus().name())
                    .extractedFullName(activeResume.getExtractedFullName())
                    .extractedEmail(activeResume.getExtractedEmail())
                    .skills(skills.stream().map(s -> AdminUserDetailResponseDto.SkillInfo.builder()
                            .name(s.getSkillName())
                            .yearsOfExperience(s.getYearsOfExperience())
                            .proficiencyLevel(s.getProficiencyLevel() != null ? s.getProficiencyLevel().name() : null)
                            .category(s.getCategory())
                            .build()).collect(Collectors.toList()))
                    .experiences(experiences.stream().map(e -> AdminUserDetailResponseDto.ExperienceInfo.builder()
                            .companyName(e.getCompanyName())
                            .jobTitle(e.getJobTitle())
                            .startDate(e.getStartDate() != null ? e.getStartDate().atStartOfDay() : null)
                            .endDate(e.getEndDate() != null ? e.getEndDate().atStartOfDay() : null)
                            .description(e.getDescription())
                            .build()).collect(Collectors.toList()))
                    .build();
        }

        List<Object[]> results = interviewSessionRepository.getAggregatedScoresForUser(userId);
        AdminUserDetailResponseDto.InterviewStats interviewStats;
        if (!results.isEmpty() && results.get(0) != null && results.get(0).length >= 5) {
            Object[] stats = results.get(0);
            Long total = stats[4] != null ? ((Number) stats[4]).longValue() : 0L;
            interviewStats = AdminUserDetailResponseDto.InterviewStats.builder()
                    .totalCompletedInterviews(total)
                    .avgOverallScore(stats[0] != null ? ((Number) stats[0]).doubleValue() : 0.0)
                    .avgCommunicationScore(stats[1] != null ? ((Number) stats[1]).doubleValue() : 0.0)
                    .avgTechnicalScore(stats[2] != null ? ((Number) stats[2]).doubleValue() : 0.0)
                    .avgConfidenceScore(stats[3] != null ? ((Number) stats[3]).doubleValue() : 0.0)
                    .build();
        } else {
            interviewStats = AdminUserDetailResponseDto.InterviewStats.builder()
                    .totalCompletedInterviews(0)
                    .avgOverallScore(0.0)
                    .avgCommunicationScore(0.0)
                    .avgTechnicalScore(0.0)
                    .avgConfidenceScore(0.0)
                    .build();
        }

        return AdminUserDetailResponseDto.builder()
                .id(user.getId())
                .userName(user.getUserName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole())
                .isActive(user.isActive())
                .isVerified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .resume(resumeInfo)
                .interviewStats(interviewStats)
                .build();
    }

    private String extractFileName(String fileKey) {
        if (fileKey == null) return null;
        int lastSlash = fileKey.lastIndexOf('/');
        return lastSlash >= 0 ? fileKey.substring(lastSlash + 1) : fileKey;
    }

    @PostConstruct
    @Override
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }
}