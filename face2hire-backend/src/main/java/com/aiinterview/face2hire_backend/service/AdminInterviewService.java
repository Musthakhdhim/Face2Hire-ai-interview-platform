package com.aiinterview.face2hire_backend.service;


import com.aiinterview.face2hire_backend.dto.AdminInterviewDetailResponseDto;
import com.aiinterview.face2hire_backend.dto.AdminInterviewFilterRequest;
import com.aiinterview.face2hire_backend.dto.AdminInterviewResponseDto;
import org.springframework.data.domain.Page;

public interface AdminInterviewService {
    Page<AdminInterviewResponseDto> getAllInterviews(AdminInterviewFilterRequest filter);
    AdminInterviewDetailResponseDto getInterviewDetail(Long interviewId);
}