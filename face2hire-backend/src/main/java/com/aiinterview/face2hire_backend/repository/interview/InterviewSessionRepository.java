package com.aiinterview.face2hire_backend.repository.interview;

import com.aiinterview.face2hire_backend.entity.interview.InterviewSession;
import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    Optional<InterviewSession> findByUserIdAndStatus(Long userId, SessionStatus status);
    List<InterviewSession> findByUserId(Long userId);
    boolean existsByScheduledInterviewIdAndStatus(Long scheduledInterviewId, SessionStatus status);
    Optional<InterviewSession> findByScheduledInterviewId(Long scheduledInterviewId);

    @Query("SELECT s FROM InterviewSession s " +
            "LEFT JOIN User u ON s.userId = u.id " +
            "WHERE (:search IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:type IS NULL OR s.type = :type) " +
            "AND (:status IS NULL OR s.status = :status) " +
            "AND (:fromDate IS NULL OR s.createdAt >= :fromDate) " +
            "AND (:toDate IS NULL OR s.createdAt <= :toDate)")
    Page<InterviewSession> findAllWithFilters(@Param("search") String search,
                                              @Param("type") InterviewType type,
                                              @Param("status") SessionStatus status,
                                              @Param("fromDate") LocalDateTime fromDate,
                                              @Param("toDate") LocalDateTime toDate,
                                              Pageable pageable);

    @Query("SELECT AVG(s.overallScore), AVG(s.communicationScore), AVG(s.technicalScore), AVG(s.confidenceScore), COUNT(s) " +
            "FROM InterviewSession s WHERE s.userId = :userId AND s.status = 'COMPLETED' AND s.overallScore IS NOT NULL")
    List<Object[]> getAggregatedScoresForUser(@Param("userId") Long userId);

    long countByStatus(SessionStatus status);

    @Query("SELECT s.type, COUNT(s) FROM InterviewSession s WHERE s.status = 'COMPLETED' GROUP BY s.type")
    List<Object[]> countCompletedInterviewsByType();

    long countByUserIdAndStatus(Long userId, SessionStatus status);

    @Query("SELECT AVG(s.overallScore) FROM InterviewSession s WHERE s.userId = :userId AND s.status = 'COMPLETED' AND s.overallScore IS NOT NULL")
    Double getAverageOverallScoreByUserId(@Param("userId") Long userId);
}