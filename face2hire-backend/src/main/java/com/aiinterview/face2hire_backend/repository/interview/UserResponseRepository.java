package com.aiinterview.face2hire_backend.repository.interview;

import com.aiinterview.face2hire_backend.entity.interview.UserResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserResponseRepository extends JpaRepository<UserResponse, Long> {
    Optional<UserResponse> findByQuestionId(Long questionId);
    List<UserResponse> findByQuestionIdIn(List<Long> questionIds);
}