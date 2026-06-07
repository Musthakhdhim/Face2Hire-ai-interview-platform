package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.ActivityAction;
import com.aiinterview.face2hire_backend.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findTop7ByOrderByCreatedAtDesc();

    @Query("SELECT a FROM ActivityLog a WHERE " +
            "(:search IS NULL OR LOWER(a.userEmail) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(a.userName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:action IS NULL OR a.action = :action)")
    Page<ActivityLog> findAllWithFilters(@Param("search") String search,
                                         @Param("action") ActivityAction action,
                                         Pageable pageable);
}
