package com.aiinterview.face2hire_backend.entity.interview;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    private InterviewType type;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    private Integer duration;

    @Column(name = "question_count")
    private Integer questionCount;

    @Enumerated(EnumType.STRING)
    private AvatarStyle avatarStyle;

    @Enumerated(EnumType.STRING)
    private SessionStatus status;

    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "communication_score")
    private Double communicationScore;

    @Column(name = "technical_score")
    private Double technicalScore;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "is_scheduled")
    private Boolean isScheduled;

    @Column(name = "scheduled_interview_id")
    private Long scheduledInterviewId;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        startedAt = LocalDateTime.now();
        status = SessionStatus.ACTIVE;
        if (isScheduled == null) isScheduled = false;
    }
}