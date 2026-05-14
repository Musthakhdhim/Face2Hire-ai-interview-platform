package com.aiinterview.face2hire_backend.redirectionresolver;


import com.aiinterview.face2hire_backend.entity.Role;
import com.aiinterview.face2hire_backend.service.DashboardPathResolver;
import org.springframework.stereotype.Component;

@Component
public class AdminDashboardPathResolver implements DashboardPathResolver {

    @Override
    public String resolvePath(String path) {
        return "/admin/dashboard";
    }

    @Override
    public Role getSupportedRole() {
        return Role.ADMIN;
    }
}
