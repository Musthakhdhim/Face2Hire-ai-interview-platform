package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByJobIdAndUserId(Long jobId, Long userId);

    Page<Application> findByUserId(Long userId, Pageable pageable);

    Page<Application> findByJobId(Long jobId, Pageable pageable);

    @Query("SELECT a FROM Application a WHERE a.jobId IN (SELECT j.id FROM Job j WHERE j.postedByUserId = :interviewerId)")
    Page<Application> findByInterviewerId(@Param("interviewerId") Long interviewerId, Pageable pageable);
}