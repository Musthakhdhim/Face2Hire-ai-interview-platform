package com.aiinterview.face2hire_backend.service;

import java.io.IOException;

public interface S3Service {
    String generatePresignedUrl(String key, String contentType);
    byte[] downloadFile(String key) throws IOException;
    String generatePresignedUrlForDownload(String key);
}