package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.EmailRequestDto;

public interface AdminEmailService {
    void sendBulkEmail(EmailRequestDto request);
}