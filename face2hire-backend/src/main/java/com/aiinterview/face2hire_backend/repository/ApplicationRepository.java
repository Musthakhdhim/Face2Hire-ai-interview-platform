package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByJobIdAndUserId(Long jobId, Long userId);

    Page<Application> findByUserId(Long userId, Pageable pageable);

    Page<Application> findByJobId(Long jobId, Pageable pageable);

    List<Application> findByJobId(Long jobId);

    @Query("SELECT a FROM Application a WHERE a.jobId IN (SELECT j.id FROM Job j WHERE j.postedByUserId = :interviewerId)")
    Page<Application> findByInterviewerId(@Param("interviewerId") Long interviewerId, Pageable pageable);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Application a JOIN Job j ON a.jobId = j.id WHERE a.userId = :userId AND j.postedByUserId = :interviewerId")
    boolean existsByUserIdAndJobPostedByUserId(@Param("userId") Long userId, @Param("interviewerId") Long interviewerId);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.jobId IN (SELECT j.id FROM Job j WHERE j.postedByUserId = :interviewerId) AND a.status = 'APPROVED'")
    long countApprovedByInterviewerId(@Param("interviewerId") Long interviewerId);
}