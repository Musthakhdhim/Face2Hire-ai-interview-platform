package com.aiinterview.face2hire_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "application_stages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationStage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    @Column(name = "stage_order", nullable = false)
    private Integer stageOrder;

    @Column(name = "stage_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private StageType stageType;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private StageStatus status;

    @Column(name = "minimum_score")
    private Double minimumScore;

    @Column(name = "actual_score")
    private Double actualScore;

    @Column(name = "scheduled_interview_id")
    private Long scheduledInterviewId;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = StageStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}