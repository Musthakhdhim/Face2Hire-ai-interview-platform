package com.aiinterview.face2hire_backend.entity;

import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import java.time.LocalDateTime;

@Entity
@Table
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "file_key", nullable = false)
    private String fileKey;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "parsed_content", columnDefinition = "TEXT")
    private String parsedContent;

    @Enumerated(EnumType.STRING)
    private ResumeStatus status;

    @Column(name = "is_active")
    private boolean isActive;

    @Column(name = "version_number")
    private int versionNumber;

    @Column(name = "extracted_full_name")
    private String extractedFullName;

    @Column(name = "extracted_email")
    private String extractedEmail;
}
