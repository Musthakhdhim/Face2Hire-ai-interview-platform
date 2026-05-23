package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    Resume findByUserIdAndIsActiveTrue(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE Resume r SET r.isActive = false WHERE r.userId = :userId AND r.isActive = true")
    void deactivateAllActiveResumesForUser(@Param("userId") Long userId);

    @Query("SELECT MAX(r.versionNumber) FROM Resume r WHERE r.userId = :userId")
    Optional<Integer> findMaxVersionByUserId(@Param("userId") Long userId);
}