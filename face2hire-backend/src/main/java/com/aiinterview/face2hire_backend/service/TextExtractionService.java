package com.aiinterview.face2hire_backend.service;

import java.io.IOException;

public interface TextExtractionService {
    String extractText(byte[] fileData, String fileName) throws IOException;
}