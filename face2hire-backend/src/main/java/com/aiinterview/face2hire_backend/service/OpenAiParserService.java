package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.ParsedResumeDto;

public interface OpenAiParserService {
    ParsedResumeDto parseResume(String extractedText);
}