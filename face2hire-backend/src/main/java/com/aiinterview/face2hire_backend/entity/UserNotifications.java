package com.aiinterview.face2hire_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_notifications")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class UserNotifications {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    private boolean emailUpdates;
    private boolean interviewReminders;
    private boolean marketingEmails;
}
