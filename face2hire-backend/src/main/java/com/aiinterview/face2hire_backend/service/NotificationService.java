package com.aiinterview.face2hire_backend.service;


import com.aiinterview.face2hire_backend.dto.NotificationsDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface NotificationService {
    void createNotification(Long userId, String title, String message, String type);
    Page<NotificationsDto> getUserNotifications(Long userId, int page, int size);
    List<NotificationsDto> getUnreadNotifications(Long userId);
    long getUnreadCount(Long userId);
    void markAsRead(Long userId, Long notificationId);
    void markAllAsRead(Long userId);
}