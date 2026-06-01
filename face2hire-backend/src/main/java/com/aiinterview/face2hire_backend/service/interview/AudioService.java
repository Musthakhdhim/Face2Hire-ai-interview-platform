package com.aiinterview.face2hire_backend.service.interview;

public interface AudioService {
    byte[] synthesizeSpeech(String text, String voice);
}