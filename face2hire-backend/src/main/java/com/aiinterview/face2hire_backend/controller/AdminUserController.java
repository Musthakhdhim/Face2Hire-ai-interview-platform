package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.UserFilterRequest;
import com.aiinterview.face2hire_backend.dto.UserListResponseDto;
import com.aiinterview.face2hire_backend.serviceimpl.AdminUserServiceImpl;
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

    @PostMapping
    public ResponseEntity<ApiResponse<Page<UserListResponseDto>>> getUsers(@RequestBody UserFilterRequest filter) {
        Page<UserListResponseDto> dtoPage = adminService.getFilteredUsersDto(filter);
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
        ApiResponse response = adminService.blockUser(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/unblock/{userId}")
    public ResponseEntity<ApiResponse<?>> unBlockUser(@PathVariable Long userId) {
        ApiResponse response = adminService.unBlockUser(userId);
        return ResponseEntity.ok(response);
    }


}
