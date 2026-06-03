package com.aiinterview.face2hire_backend.service.interview;

import com.aiinterview.face2hire_backend.dto.interview.OverallFeedbackDto;

public interface PdfReportService {
    byte[] generateFeedbackPdf(OverallFeedbackDto feedback, Long sessionId);
}