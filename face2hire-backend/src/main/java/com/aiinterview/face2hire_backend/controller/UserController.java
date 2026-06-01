package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.UserSearchDto;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/search")
    @PreAuthorize("hasRole('INTERVIEWER')")
    public ResponseEntity<List<UserSearchDto>> searchUsers(@RequestParam String email) {
        List<User> users = userRepository.findByEmailContainingIgnoreCase(email);
        List<UserSearchDto> dtos = users.stream()
                .filter(u -> u.getRole().name().equals("INTERVIEWEE"))
                .map(u -> new UserSearchDto(u.getId(), u.getFullName(), u.getEmail()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}