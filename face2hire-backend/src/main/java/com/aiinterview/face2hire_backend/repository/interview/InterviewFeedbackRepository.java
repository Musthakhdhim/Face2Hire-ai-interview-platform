package com.aiinterview.face2hire_backend.repository.interview;

import com.aiinterview.face2hire_backend.entity.interview.InterviewFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InterviewFeedbackRepository extends JpaRepository<InterviewFeedback, Long> {
    Optional<InterviewFeedback> findBySessionId(Long sessionId);
}