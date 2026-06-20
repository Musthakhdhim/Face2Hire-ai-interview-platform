package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.ApplicationStage;
import com.aiinterview.face2hire_backend.entity.StageStatus;
import com.aiinterview.face2hire_backend.entity.StageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationStageRepository extends JpaRepository<ApplicationStage, Long> {
    List<ApplicationStage> findByApplicationIdOrderByStageOrderAsc(Long applicationId);
    Optional<ApplicationStage> findByApplicationIdAndStageOrder(Long applicationId, Integer stageOrder);
    Optional<ApplicationStage> findByApplicationIdAndStageType(Long applicationId, StageType stageType);
    List<ApplicationStage> findByApplicationIdAndStatus(Long applicationId, StageStatus status);
    boolean existsByApplicationIdAndStatusAndStageType(Long applicationId, StageStatus status, StageType stageType);
}