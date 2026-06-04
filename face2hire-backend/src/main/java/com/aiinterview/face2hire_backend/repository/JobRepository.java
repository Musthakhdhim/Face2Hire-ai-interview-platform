package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.Job;
import com.aiinterview.face2hire_backend.entity.JobStatus;
import com.aiinterview.face2hire_backend.entity.JobType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {
    Page<Job> findByPostedByUserId(Long userId, Pageable pageable);
    Page<Job> findByStatus(JobStatus status, Pageable pageable);

    @Query("SELECT DISTINCT j FROM Job j LEFT JOIN JobSkill js ON j.id = js.jobId WHERE j.status = 'ACTIVE' AND (LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(j.company) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(js.skillName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Job> searchActiveJobs(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT j FROM Job j " +
            "LEFT JOIN User u ON j.postedByUserId = u.id " +
            "WHERE (:search IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "   OR LOWER(j.company) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:type IS NULL OR j.type = :type) " +
            "AND (:status IS NULL OR j.status = :status) " +
            "AND (:postedByUserId IS NULL OR j.postedByUserId = :postedByUserId) " +
            "AND (:fromDate IS NULL OR j.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR j.createdAt <= :toDate)")
    Page<Job> findAllWithFilters(@Param("search") String search,
                                 @Param("type") JobType type,
                                 @Param("status") JobStatus status,
                                 @Param("postedByUserId") Long postedByUserId,
                                 @Param("fromDate") LocalDateTime fromDate,
                                 @Param("toDate") LocalDateTime toDate,
                                 Pageable pageable);
}