package com.aiinterview.face2hire_backend.service.interview;

public interface AudioProcessor {
    byte[] downloadAudio(String audioUrl);
    String transcribe(byte[] audioData);
}