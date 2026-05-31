package com.aiinterview.face2hire_backend.controller.interview;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.interview.AudioUploadRequest;
import com.aiinterview.face2hire_backend.dto.interview.AudioUploadResponse;
import com.aiinterview.face2hire_backend.dto.interview.AudioConfirmRequest;
import com.aiinterview.face2hire_backend.dto.interview.AudioConfirmResponse;
import com.aiinterview.face2hire_backend.dto.interview.TtsRequest;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.service.interview.AudioService;
import com.aiinterview.face2hire_backend.service.S3Service;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/audio")
@RequiredArgsConstructor
public class AudioController {

    private final AudioService audioService;
    private final S3Service s3Service;

    @PostMapping("/upload-url")
    public ResponseEntity<ApiResponse<AudioUploadResponse>> getUploadUrl(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AudioUploadRequest request) {
        String fileKey = String.format("audio/%d/%s", userDetails.getUser().getId(), request.getFileName());
        String presignedUrl = s3Service.generatePresignedUrl(fileKey, request.getFileType());
        AudioUploadResponse response = new AudioUploadResponse(presignedUrl, fileKey);
        return ResponseEntity.ok(ApiResponse.<AudioUploadResponse>builder()
                .success(true)
                .data(response)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<AudioConfirmResponse>> confirmUpload(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody AudioConfirmRequest request) {
        String audioUrl = s3Service.generatePresignedUrlForDownload(request.getFileKey());
        AudioConfirmResponse response = new AudioConfirmResponse(audioUrl);
        return ResponseEntity.ok(ApiResponse.<AudioConfirmResponse>builder()
                .success(true)
                .data(response)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    @PostMapping("/tts")
    public ResponseEntity<byte[]> textToSpeech(@RequestBody TtsRequest request) {
        byte[] audioData = audioService.synthesizeSpeech(request.getText(), request.getVoice());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .body(audioData);
    }
}