package com.aiinterview.face2hire_backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String company;

    private String location;

    @Enumerated(EnumType.STRING)
    private JobType type;

    private String salary;

    private Integer matchPercentage;

    @Column(name = "required_experience")
    private Integer requiredExperience;

    @Column(length = 2000)
    private String description;

    @Column(name = "posted_by_user_id", nullable = false)
    private Long postedByUserId;

    @Column(name = "applicants_count")
    private Integer applicantsCount;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @Column(name = "has_multi_round")
    private Boolean hasMultiRound;

    @Column(name = "workflow_config", columnDefinition = "TEXT")
    private String workflowConfig;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = JobStatus.ACTIVE;
        if (applicantsCount == null) applicantsCount = 0;
        if (hasMultiRound == null) hasMultiRound = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}