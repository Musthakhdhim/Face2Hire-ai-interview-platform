package com.aiinterview.face2hire_backend.redirectionresolver;


import com.aiinterview.face2hire_backend.entity.Role;
import com.aiinterview.face2hire_backend.service.DashboardPathResolver;
import org.springframework.stereotype.Component;

@Component
public class IntervieweeDashboardPathResolver implements DashboardPathResolver {
    @Override
    public String resolvePath(String path) {
        return "/interviewee/dashboard";
    }

    @Override
    public Role getSupportedRole() {
        return Role.INTERVIEWEE;
    }
}
