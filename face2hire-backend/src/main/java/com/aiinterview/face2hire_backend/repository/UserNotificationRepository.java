package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.UserNotifications;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotifications,Long> {
    Optional<UserNotifications> findByUserId(Long userId);

}
