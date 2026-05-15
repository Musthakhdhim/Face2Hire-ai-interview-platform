package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.UserFilterRequest;
import com.aiinterview.face2hire_backend.dto.UserListResponseDto;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.serviceimpl.AdminUserServiceImpl;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final AdminUserServiceImpl adminService;
    private final ModelMapper modelMapper;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Page<UserListResponseDto>>> getUsers(@RequestBody UserFilterRequest filter) {
        log.info("Received request to fetch users - search: {}, role: {}, active: {}, page: {}, size: {}",
                filter.getSearch(), filter.getRole(), filter.getIsActive(), filter.getPage(), filter.getSize());
        Page<UserListResponseDto> dtoPage = adminService.getFilteredUsersDto(filter);
        log.info("Returned {} users out of {} total", dtoPage.getNumberOfElements(), dtoPage.getTotalElements());
        ApiResponse<Page<UserListResponseDto>> response = ApiResponse.<Page<UserListResponseDto>>builder()
                .success(true)
                .message("Users retrieved successfully")
                .data(dtoPage)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/block/{userId}")
    public ResponseEntity<ApiResponse<?>> blockUser(@PathVariable Long userId) {
        log.info("Received request to block user with id: {}", userId);
        ApiResponse response = adminService.blockUser(userId);
        if (response.isSuccess()) {
            log.info("User {} blocked successfully", userId);
        } else {
            log.warn("Block user {} failed: {}", userId, response.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/unblock/{userId}")
    public ResponseEntity<ApiResponse<?>> unBlockUser(@PathVariable Long userId) {
        log.info("Received request to unblock user with id: {}", userId);
        ApiResponse response = adminService.unBlockUser(userId);
        if (response.isSuccess()) {
            log.info("User {} unblocked successfully", userId);
        } else {
            log.warn("Unblock user {} failed: {}", userId, response.getMessage());
        }
        return ResponseEntity.ok(response);
    }
}