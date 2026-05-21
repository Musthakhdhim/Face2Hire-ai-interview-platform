package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.ConfirmUploadRequest;
import com.aiinterview.face2hire_backend.dto.ResumeUploadResponse;
import com.aiinterview.face2hire_backend.entity.Resume;
import com.aiinterview.face2hire_backend.repository.ResumeRepository;
import com.aiinterview.face2hire_backend.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final S3Service s3Service;
    private final ResumeProcessingService processingService;
    private final ResumeRepository resumeRepository;

    public ResumeUploadResponse generateUploadUrl(Long userId, String fileName, String fileType) {
        String fileKey = String.format("resumes/%d/%s_%s", userId, UUID.randomUUID(), fileName);
        String presignedUrl = s3Service.generatePresignedUrl(fileKey, fileType);
        return new ResumeUploadResponse(presignedUrl, fileKey);
    }

    public Resume confirmUpload(Long userId, ConfirmUploadRequest request, String userFullName) {
        return processingService.processUpload(userId, request.getFileKey(), request.getFileKey(), userFullName);
    }

    public Resume getActiveResume(Long userId) {
        return resumeRepository.findByUserIdAndIsActiveTrue(userId);
    }
}