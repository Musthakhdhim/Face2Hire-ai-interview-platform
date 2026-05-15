package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.UserListResponseDto;
import com.aiinterview.face2hire_backend.dto.UserFilterRequest;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.AdminStatsDto;
import com.aiinterview.face2hire_backend.dto.UserGrowthDto;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.exception.UserNotFoundException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.service.AdminUserService;
import com.aiinterview.face2hire_backend.specification.UserSpecification;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
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
        long totalInterviews = 0;
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

    @PostConstruct
    @Override
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }
}