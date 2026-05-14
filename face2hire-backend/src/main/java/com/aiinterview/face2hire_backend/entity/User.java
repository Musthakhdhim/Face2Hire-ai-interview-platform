package com.aiinterview.face2hire_backend.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userName;

    private String fullName;

    @Column(nullable = false,unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String profileImageUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    private boolean isActive;

    private boolean isVerified=false;

    @Column(name = "auth_provider")
    @Enumerated(EnumType.STRING)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    private String providerId;

    private String phoneNumber;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = true)
    private UserPreferences preferences;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = true)
    private UserNotifications notifications;

    public void initSettings() {
        if (this.preferences == null) {
            this.preferences = UserPreferences.builder()
                    .user(this)
                    .defaultInterviewType("technical")
                    .avatarStyle("professional")
                    .language("english")
                    .build();
        }
        if (this.notifications == null) {
            this.notifications = UserNotifications.builder()
                    .user(this)
                    .emailUpdates(true)
                    .interviewReminders(true)
                    .marketingEmails(false)
                    .build();
        }
    }
}
