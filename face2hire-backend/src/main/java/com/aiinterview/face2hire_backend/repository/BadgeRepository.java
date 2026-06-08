package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.Badge;
import com.aiinterview.face2hire_backend.entity.BadgeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findByName(String name);
    Page<Badge> findByType(BadgeType type, Pageable pageable);
    List<Badge> findAll();
}
