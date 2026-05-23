package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.ConfirmUploadRequest;
import com.aiinterview.face2hire_backend.dto.ResumeUploadResponse;
import com.aiinterview.face2hire_backend.entity.Resume;
import com.aiinterview.face2hire_backend.entity.ResumeStatus;
import com.aiinterview.face2hire_backend.exception.ResourceNotFoundException;
import com.aiinterview.face2hire_backend.repository.ApplicationRepository;
import com.aiinterview.face2hire_backend.repository.ResumeRepository;
import com.aiinterview.face2hire_backend.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final S3Service s3Service;
    private final ResumeProcessingService processingService;
    private final ResumeRepository resumeRepository;
    private final ApplicationRepository applicationRepository;

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

    public String getResumeDownloadUrlForInterviewer(Long interviewerId, Long applicantId) {
        boolean hasAccess = applicationRepository.existsByUserIdAndJobPostedByUserId(applicantId, interviewerId);
        if (!hasAccess) {
            throw new AccessDeniedException("You are not authorized to download this candidate's resume");
        }
        Resume resume = resumeRepository.findByUserIdAndIsActiveTrue(applicantId);
        if (resume == null || resume.getStatus() != ResumeStatus.COMPLETED) {
            throw new ResourceNotFoundException("Resume not found or not yet processed");
        }
        return s3Service.generatePresignedUrlForDownload(resume.getFileKey());
    }
}