package com.aiinterview.face2hire_backend.entity.interview;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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
    @Column(name = "interview_mode")
    private InterviewMode interviewMode;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    private Integer duration;

    @Column(name = "question_count")
    private Integer questionCount;

    @Enumerated(EnumType.STRING)
    private AvatarStyle avatarStyle;

    @Column(name = "scheduled_by_interviewer")
    private String scheduledByInterviewer;

    @Column(name = "application_id")
    private Long applicationId;

    @Column(name = "minimum_score")
    private Double minimumScore;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "meeting_id")
    private String meetingId;

    @Column(name = "meeting_join_url", columnDefinition = "TEXT")
    private String meetingJoinUrl;

    @Column(name = "meeting_start_url", columnDefinition = "TEXT")
    private String meetingStartUrl;

    @Column(name = "meeting_passcode")
    private String meetingPasscode;

    @Column(name = "call_ended")
    private Boolean callEnded;

    @Column(name = "live_completed")
    private Boolean liveCompleted;

    @Column(name = "stage_id")
    private Long stageId;

    @Column(name = "application_stage_id")
    private Long applicationStageId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (interviewMode == null) {
            interviewMode = InterviewMode.AI;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}