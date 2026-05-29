package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.service.S3Service;
import com.aiinterview.face2hire_backend.service.interview.AudioProcessor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URL;

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
            URL url = new URL(audioUrl);
            try (InputStream is = url.openStream()) {
                return is.readAllBytes();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to download audio from S3", e);
        }
    }

    @Override
    public String transcribe(byte[] audioData) {
        try {
            // Whisper API requires a file upload
            return webClient.post()
                    .uri("https://api.openai.com/v1/audio/transcriptions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(Mono.just(audioData), byte[].class) // Need to build multipart properly
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            throw new RuntimeException("Whisper transcription failed", e);
        }
    }
}