package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.OtpType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class OtpData {
    private String otp;
    private long generatedAt;
    private int expirySeconds;
    private OtpType type;
    private int attempts;

    public boolean isExpired() {
        return System.currentTimeMillis() > generatedAt + (expirySeconds * 1000L);
    }

    public long getRemainingSeconds() {
        long remaining = (generatedAt + (expirySeconds * 1000L)) - System.currentTimeMillis();
        return remaining > 0 ? remaining / 1000 : 0;
    }
}
