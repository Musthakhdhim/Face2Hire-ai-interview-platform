package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.service.S3Service;
import com.aiinterview.face2hire_backend.service.interview.AudioProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.InputStream;
import java.net.URL;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhisperAudioProcessor implements AudioProcessor {

    private final S3Service s3Service;
    private final WebClient webClient;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.whisper.model}")
    private String whisperModel;

    @Override
    public byte[] downloadAudio(String audioUrl) {
        try {
            log.info("Downloading audio from: {}", audioUrl);
            URL url = new URL(audioUrl);
            try (InputStream is = url.openStream()) {
                return is.readAllBytes();
            }
        } catch (Exception e) {
            log.error("Failed to download audio from S3", e);
            throw new RuntimeException("Failed to download audio from S3", e);
        }
    }

    @Override
    public String transcribe(byte[] audioData) {
        log.info("Transcribing audio of size {} bytes", audioData.length);
        try {
            MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
            bodyBuilder.part("file", new ByteArrayResource(audioData) {
                @Override
                public String getFilename() {
                    return "audio.webm";
                }
            }).contentType(MediaType.APPLICATION_OCTET_STREAM);
            bodyBuilder.part("model", whisperModel);
            bodyBuilder.part("response_format", "text");

            String response = webClient.post()
                    .uri("https://api.openai.com/v1/audio/transcriptions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .bodyValue(bodyBuilder.build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Transcription successful, length: {}", response != null ? response.length() : 0);
            return response != null ? response : "";
        } catch (Exception e) {
            log.error("Whisper transcription failed", e);
            throw new RuntimeException("Whisper transcription failed: " + e.getMessage(), e);
        }
    }
}