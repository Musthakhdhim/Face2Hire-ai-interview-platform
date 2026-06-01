package com.aiinterview.face2hire_backend.repository.interview;

import com.aiinterview.face2hire_backend.entity.interview.InterviewSession;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    Optional<InterviewSession> findByUserIdAndStatus(Long userId, SessionStatus status);
    List<InterviewSession> findByUserId(Long userId);
    boolean existsByScheduledInterviewIdAndStatus(Long scheduledInterviewId, SessionStatus status);
    Optional<InterviewSession> findByScheduledInterviewId(Long scheduledInterviewId);
}