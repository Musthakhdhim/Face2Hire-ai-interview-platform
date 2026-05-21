package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Resume findByUserIdAndIsActiveTrue(Long userId);
}