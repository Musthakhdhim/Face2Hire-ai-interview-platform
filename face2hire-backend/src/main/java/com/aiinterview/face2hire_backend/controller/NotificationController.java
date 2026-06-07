package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.NotificationsDto;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationsDto>>> getUnreadNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        List<NotificationsDto> notifications = notificationService.getUnreadNotifications(userId);
        long count = notificationService.getUnreadCount(userId);
        ApiResponse<List<NotificationsDto>> response = ApiResponse.<List<NotificationsDto>>builder()
                .success(true)
                .message("Unread notifications retrieved")
                .data(notifications)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        long count = notificationService.getUnreadCount(userId);
        ApiResponse<Long> response = ApiResponse.<Long>builder()
                .success(true)
                .message("Unread count retrieved")
                .data(count)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationsDto>>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = userDetails.getUser().getId();
        Page<NotificationsDto> notifications = notificationService.getUserNotifications(userId, page, size);
        ApiResponse<Page<NotificationsDto>> response = ApiResponse.<Page<NotificationsDto>>builder()
                .success(true)
                .message("Notifications retrieved")
                .data(notifications)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long notificationId) {
        Long userId = userDetails.getUser().getId();
        notificationService.markAsRead(userId, notificationId);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Notification marked as read")
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        notificationService.markAllAsRead(userId);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("All notifications marked as read")
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}
