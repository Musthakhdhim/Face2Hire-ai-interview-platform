package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.UserPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPreferenceRepository extends JpaRepository<UserPreferences,Long> {

    Optional<UserPreferences> findByUserId(Long userId);

}
