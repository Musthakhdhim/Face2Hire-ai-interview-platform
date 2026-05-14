package com.aiinterview.face2hire_backend.service;


import com.aiinterview.face2hire_backend.entity.Role;

public interface DashboardPathResolver {
    String resolvePath(String path);
    Role getSupportedRole();
}
