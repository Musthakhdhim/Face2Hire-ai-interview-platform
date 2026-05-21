package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.JobListResponseDto;
import com.aiinterview.face2hire_backend.dto.JobRequestDto;
import com.aiinterview.face2hire_backend.dto.JobResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.nio.file.AccessDeniedException;

public interface JobService {
    JobResponseDto createJob(Long userId, JobRequestDto request);
    JobResponseDto getJobById(Long jobId);
    Page<JobListResponseDto> getJobsByInterviewer(Long userId, Pageable pageable);
    Page<JobListResponseDto> getAllActiveJobs(String keyword, Pageable pageable);
    JobResponseDto updateJob(Long jobId, Long userId, JobRequestDto request) throws AccessDeniedException;
    void deleteJob(Long jobId, Long userId) throws AccessDeniedException;
    JobResponseDto closeJob(Long jobId, Long userId) throws AccessDeniedException; // set status to CLOSED
}