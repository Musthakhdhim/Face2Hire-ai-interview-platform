package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.service.S3FileUploadService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class S3FileUploadServiceImpl implements S3FileUploadService {

    @Value("${aws.s3.bucket:ai-interview-profile-images}")
    private String bucketName;

    @Value("${aws.region:ap-south-1}")
    private String region;

    @Value("${aws.s3.enabled:false}")
    private boolean s3Enabled;

    @Value("${aws.s3.local-fallback:true}")
    private boolean localFallback;

    @Value("${storage.local.dir:uploads}")
    private String localStorageDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    private final S3Client s3Client;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    public S3FileUploadServiceImpl(S3Client s3Client, AppLoggerFactory loggerFactory) {
        this.s3Client = s3Client;
        this.loggerFactory = loggerFactory;
    }

    @Override
    public String uploadProfileImage(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String key = "profile-images/" + UUID.randomUUID() + extension;

        if (s3Enabled) {
            try {
                PutObjectRequest putRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(contentType)
                        .build();

                s3Client.putObject(putRequest, RequestBody.fromBytes(file.getBytes()));

                return String.format("https://%s.s3.%s.amazonaws.com/%s",
                        bucketName, region, key);
            } catch (Exception e) {
                if (!localFallback) {
                    throw new IOException("Failed to upload profile image to S3", e);
                }
                if (log != null) {
                    log.warn("S3 upload failed, falling back to local storage: {}", e.getMessage());
                }
            }
        }

        return saveToLocalStorage(key, file.getBytes());
    }

    private String saveToLocalStorage(String key, byte[] bytes) throws IOException {
        Path baseDir = Paths.get(localStorageDir).toAbsolutePath().normalize();
        Path targetPath = baseDir.resolve(key).normalize();
        if (!targetPath.startsWith(baseDir)) {
            throw new IOException("Invalid storage key: " + key);
        }
        Path parent = targetPath.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        Files.write(targetPath, bytes);
        String normalizedBase = baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1)
                : baseUrl;
        String encodedKey = URLEncoder.encode(key, StandardCharsets.UTF_8);
        return normalizedBase + "/api/v1/storage/download?key=" + encodedKey;
    }

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }
}
