package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.*;
import jakarta.annotation.PostConstruct;
import org.springframework.data.domain.Page;

import java.util.List;

public interface AdminUserService {
    Page<UserListResponseDto> getFilteredUsersDto(UserFilterRequest filter);

    ApiResponse<?> blockUser(Long userId);

    ApiResponse<?> unBlockUser(Long userId);

    ApiResponse<AdminStatsDto> getAdminStats();

    List<UserGrowthDto> getUserGrowth();

    @PostConstruct
    void init();
}
