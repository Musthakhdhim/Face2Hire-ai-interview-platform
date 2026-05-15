package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.UserListResponseDto;
import com.aiinterview.face2hire_backend.dto.UserFilterRequest;
import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.AdminStatsDto;
import com.aiinterview.face2hire_backend.dto.UserGrowthDto;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.exception.UserNotFoundException;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.specification.UserSpecification;
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
public class AdminUserServiceImpl {

    private final UserRepository userRepository;

    public Page<UserListResponseDto> getFilteredUsersDto(UserFilterRequest filter) {
        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage = userRepository.findAll(
                UserSpecification.filterBy(filter.getSearch(), filter.getRole(), filter.getIsActive()),
                pageable
        );

        userPage.getContent().forEach(user ->
                System.out.println("User: " + user.getEmail() + " isActive: " + user.isActive()));

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

    public ApiResponse<?> blockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        if (!user.isActive()) {
            return ApiResponse.builder()
                    .success(false)
                    .message("User is already blocked")
                    .statusCode(HttpStatus.BAD_REQUEST.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        user.setActive(false);
        userRepository.save(user);

        return ApiResponse.builder()
                .statusCode(HttpStatus.OK.value())
                .success(true)
                .message("User account successfully blocked")
                .time(LocalDateTime.now())
                .data(null)
                .build();
    }

    public ApiResponse<?> unBlockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));

        if (user.isActive()) {
            return ApiResponse.builder()
                    .success(false)
                    .message("User is already unblocked")
                    .statusCode(HttpStatus.BAD_REQUEST.value())
                    .time(LocalDateTime.now())
                    .build();
        }

        user.setActive(true);
        userRepository.save(user);

        return ApiResponse.builder()
                .statusCode(HttpStatus.OK.value())
                .success(true)
                .message("User account successfully unlocked")
                .time(LocalDateTime.now())
                .data(null)
                .build();
    }

    public ApiResponse<AdminStatsDto> getAdminStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActive(true);
        long totalInterviews = 0;
        long premiumUsers = 0;

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

    public List<UserGrowthDto> getUserGrowth() {
        List<Object[]> results = userRepository.countUsersByMonth();
        return results.stream()
                .map(row -> UserGrowthDto.builder()
                        .month((String) row[0])
                        .users(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
    }


}
