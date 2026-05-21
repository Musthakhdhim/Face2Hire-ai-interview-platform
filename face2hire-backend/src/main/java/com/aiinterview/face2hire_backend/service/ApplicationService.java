package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.ApplicationListResponseDto;
import com.aiinterview.face2hire_backend.dto.ApplicationRequestDto;
import com.aiinterview.face2hire_backend.dto.ApplicationResponseDto;
import com.aiinterview.face2hire_backend.dto.ApplicationStatusUpdateDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.nio.file.AccessDeniedException;

public interface ApplicationService {
    ApplicationResponseDto applyForJob(Long userId, ApplicationRequestDto request);
    Page<ApplicationListResponseDto> getMyApplications(Long userId, Pageable pageable);
    Page<ApplicationListResponseDto> getApplicationsForJob(Long jobId, Pageable pageable);
    Page<ApplicationListResponseDto> getApplicationsForInterviewer(Long interviewerId, Pageable pageable);
    ApplicationResponseDto updateApplicationStatus(Long applicationId, Long interviewerId, ApplicationStatusUpdateDto dto) throws AccessDeniedException;
    ApplicationResponseDto getApplicationById(Long applicationId, Long currentUserId) throws AccessDeniedException;
}