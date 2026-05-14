package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl {

    private final UserRepository userRepository;
}
