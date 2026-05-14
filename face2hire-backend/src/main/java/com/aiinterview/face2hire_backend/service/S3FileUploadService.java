package com.aiinterview.face2hire_backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface S3FileUploadService {
    String uploadProfileImage(MultipartFile file) throws IOException;
}
