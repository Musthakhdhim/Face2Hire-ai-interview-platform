package com.aiinterview.face2hire_backend.entity.interview;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scheduled_interviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledInterview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "interviewee_id", nullable = false)
    private Long intervieweeId;

    @Column(name = "interviewee_name")
    private String intervieweeName;

    @Enumerated(EnumType.STRING)
    private InterviewType type;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    private Integer duration;

    @Column(name = "question_count")
    private Integer questionCount;

    @Enumerated(EnumType.STRING)
    private AvatarStyle avatarStyle;

    @Column(name = "scheduled_by_interviewer")
    private String scheduledByInterviewer;


    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}