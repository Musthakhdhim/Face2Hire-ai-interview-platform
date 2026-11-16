package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class S3ServiceImpl implements S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket:ai-interview-profile-images}")
    private String bucketName;

    @Value("${aws.s3.enabled:false}")
    private boolean s3Enabled;

    @Value("${aws.s3.local-fallback:true}")
    private boolean localFallback;

    @Value("${storage.local.dir:uploads}")
    private String localStorageDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Override
    public String generatePresignedUrl(String key, String contentType) {
        if (!s3Enabled) {
            return buildLocalUploadUrl(key);
        }
        try (S3Presigner presigner = S3Presigner.builder()
                .region(s3Client.serviceClientConfiguration().region())
                .credentialsProvider(s3Client.serviceClientConfiguration().credentialsProvider())
                .build()) {

            PutObjectRequest objectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(5))
                    .putObjectRequest(objectRequest)
                    .build();

            return presigner.presignPutObject(presignRequest).url().toString();
        } catch (Exception e) {
            if (localFallback) {
                return buildLocalUploadUrl(key);
            }
            throw e;
        }
    }

    @Override
    public byte[] downloadFile(String key) throws IOException {
        Path localPath = resolveLocalPath(key);
        if (localPath != null && Files.exists(localPath) && Files.isRegularFile(localPath)) {
            return Files.readAllBytes(localPath);
        }
        if (!s3Enabled) {
            throw new IOException("File not found in local storage: " + key);
        }
        try {
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            ResponseBytes<GetObjectResponse> response = s3Client.getObjectAsBytes(getRequest);
            return response.asByteArray();
        } catch (S3Exception e) {
            throw new IOException("Failed to download file from S3: "
                    + e.awsErrorDetails().errorMessage(), e);
        }
    }

    @Override
    public String generatePresignedUrlForDownload(String key) {
        Path localPath = resolveLocalPath(key);
        if (!s3Enabled || (localPath != null && Files.exists(localPath))) {
            return buildLocalDownloadUrl(key);
        }
        try (S3Presigner presigner = S3Presigner.builder()
                .region(s3Client.serviceClientConfiguration().region())
                .credentialsProvider(s3Client.serviceClientConfiguration().credentialsProvider())
                .build()) {
            GetObjectRequest objectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15))
                    .getObjectRequest(objectRequest)
                    .build();
            return presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception e) {
            if (localFallback) {
                return buildLocalDownloadUrl(key);
            }
            throw e;
        }
    }

    private Path resolveLocalPath(String key) {
        Path baseDir = Paths.get(localStorageDir).toAbsolutePath().normalize();
        Path targetPath = baseDir.resolve(key).normalize();
        if (!targetPath.startsWith(baseDir)) {
            return null;
        }
        return targetPath;
    }

    private String buildLocalUploadUrl(String key) {
        String encodedKey = URLEncoder.encode(key, StandardCharsets.UTF_8);
        return normalizeBaseUrl() + "/api/v1/storage/upload?key=" + encodedKey;
    }

    private String buildLocalDownloadUrl(String key) {
        String encodedKey = URLEncoder.encode(key, StandardCharsets.UTF_8);
        return normalizeBaseUrl() + "/api/v1/storage/download?key=" + encodedKey;
    }

    private String normalizeBaseUrl() {
        if (baseUrl.endsWith("/")) {
            return baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
    }
}
