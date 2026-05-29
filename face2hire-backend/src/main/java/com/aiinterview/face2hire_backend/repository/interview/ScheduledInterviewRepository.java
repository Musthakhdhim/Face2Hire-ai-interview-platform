package com.aiinterview.face2hire_backend.repository.interview;

import com.aiinterview.face2hire_backend.entity.interview.ScheduledInterview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScheduledInterviewRepository extends JpaRepository<ScheduledInterview, Long> {
    List<ScheduledInterview> findByIntervieweeId(Long intervieweeId);
    List<ScheduledInterview> findByScheduledByInterviewer(String interviewerName);
}