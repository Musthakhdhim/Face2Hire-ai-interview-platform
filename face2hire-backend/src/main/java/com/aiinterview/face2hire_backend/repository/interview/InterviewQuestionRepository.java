package com.aiinterview.face2hire_backend.repository.interview;

import com.aiinterview.face2hire_backend.entity.interview.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findBySessionIdOrderByQuestionIndexAsc(Long sessionId);
}