package com.aiinterview.face2hire_backend.repository.interview;

import com.aiinterview.face2hire_backend.entity.interview.QuestionFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface QuestionFeedbackRepository extends JpaRepository<QuestionFeedback, Long> {
    Optional<QuestionFeedback> findByUserResponseId(Long userResponseId);
}