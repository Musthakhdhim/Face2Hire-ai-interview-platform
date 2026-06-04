package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.AdminReportsDto;

import java.time.LocalDate;

public interface AdminReportsService {
    AdminReportsDto getReports(LocalDate startDate, LocalDate endDate);
}