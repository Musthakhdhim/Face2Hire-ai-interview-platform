package com.aiinterview.face2hire_backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@RestController
@RequestMapping("/api/v1/storage")
public class LocalStorageController {

    @Value("${storage.local.dir:uploads}")
    private String localStorageDir;

    @PutMapping("/upload")
    public ResponseEntity<Void> uploadFile(
            @RequestParam("key") String key,
            HttpServletRequest request) throws IOException {
        Path baseDir = Paths.get(localStorageDir).toAbsolutePath().normalize();
        Path targetPath = baseDir.resolve(key).normalize();
        if (!targetPath.startsWith(baseDir)) {
            return ResponseEntity.badRequest().build();
        }
        Path parent = targetPath.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        Files.copy(request.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadFile(
            @RequestParam("key") String key) throws IOException {
        Path baseDir = Paths.get(localStorageDir).toAbsolutePath().normalize();
        Path targetPath = baseDir.resolve(key).normalize();
        if (!targetPath.startsWith(baseDir)) {
            return ResponseEntity.badRequest().build();
        }
        if (!Files.exists(targetPath) || !Files.isRegularFile(targetPath)) {
            return ResponseEntity.notFound().build();
        }
        byte[] data = Files.readAllBytes(targetPath);
        String contentType = resolveContentType(targetPath);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(data);
    }

    private String resolveContentType(Path path) throws IOException {
        String detected = Files.probeContentType(path);
        if (detected != null && !detected.isBlank()) {
            return detected;
        }
        String fileName = path.getFileName().toString().toLowerCase();
        if (fileName.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (fileName.endsWith(".png")) {
            return "image/png";
        }
        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (fileName.endsWith(".gif")) {
            return "image/gif";
        }
        if (fileName.endsWith(".webm")) {
            return "audio/webm";
        }
        if (fileName.endsWith(".mp3")) {
            return "audio/mpeg";
        }
        return "application/octet-stream";
    }
}
