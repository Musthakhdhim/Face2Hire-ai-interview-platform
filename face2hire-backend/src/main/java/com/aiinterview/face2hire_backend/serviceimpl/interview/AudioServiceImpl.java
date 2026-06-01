package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.service.interview.AudioService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AudioServiceImpl implements AudioService {

    private final WebClient webClient;

    @Value("${openai.api.key}")
    private String apiKey;

    @Override
    public byte[] synthesizeSpeech(String text, String voice) {
        String openAiVoice = mapVoice(voice);

        Map<String, Object> requestBody = Map.of(
                "model", "tts-1",
                "voice", openAiVoice,
                "input", text
        );

        return webClient.post()
                .uri("https://api.openai.com/v1/audio/speech")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(byte[].class)
                .block();
    }

    private String mapVoice(String avatarStyle) {
        return switch (avatarStyle) {
            case "professional" -> "echo";
            case "friendly" -> "nova";
            case "strict" -> "onyx";
            default -> "alloy";
        };
    }
}
