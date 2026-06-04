package com.aiinterview.face2hire_backend.service;


import com.aiinterview.face2hire_backend.dto.AdminJobDetailResponseDto;
import com.aiinterview.face2hire_backend.dto.AdminJobFilterRequest;
import com.aiinterview.face2hire_backend.dto.AdminJobResponseDto;
import org.springframework.data.domain.Page;

public interface AdminJobService {
    Page<AdminJobResponseDto> getAllJobs(AdminJobFilterRequest filter);

    AdminJobDetailResponseDto getJobDetail(Long jobId);
}