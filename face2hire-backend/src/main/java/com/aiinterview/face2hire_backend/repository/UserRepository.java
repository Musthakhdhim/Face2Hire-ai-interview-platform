package com.aiinterview.face2hire_backend.repository;

import com.aiinterview.face2hire_backend.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUserName(@NotBlank(message = "username should not be blank") @Size(min = 5, max = 20, message = "fullname should be of 5-20 character in length") String userName);

    User findByEmail(String email);

    boolean existsByEmail(String email);
    boolean existsByUserName(String userName);

}
