package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.JobSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JobSkillRepository extends JpaRepository<JobSkill, Long> {
    List<JobSkill> findByJobId(Long jobId);
    void deleteByJobId(Long jobId);
}