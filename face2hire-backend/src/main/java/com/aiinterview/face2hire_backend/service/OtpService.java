package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.entity.OtpType;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

public interface OtpService {
    @PostConstruct
    void startCleanup();

    String generateOtp(String userEmail, OtpType type);

    boolean validateOtp(String userEmail, OtpType type, String otp);

    void markOtpVerified(String userEmail, OtpType type);

    boolean isOtpVerified(String userEmail, OtpType type);

    void clearVerifiedOtp(String userEmail, OtpType type);

    boolean canRequestOtp(String userEmail, OtpType type);

    long getRemainingBlockTime(String userEmail, OtpType type);

    void incrementOtpRequestCount(String userEmail, OtpType type);

    boolean isOtpValid(String userEmail, OtpType type);

    long getOtpRemainingSeconds(String userEmail, OtpType type);

    void invalidateOtp(String userEmail, OtpType type);

    void recordFailedAttempt(String userEmail, OtpType type);

    void clearFailedAttempts(String userEmail, OtpType type);

    boolean isUserBlocked(String userEmail, OtpType type);

    int getRemainingFailedAttempts(String userEmail, OtpType type);

    void cleanupExpiredEntries();

    String buildIdentifier(String userEmail, OtpType type);

    String getCacheStats();

    int getRequestCount(String userEmail, OtpType type);

    boolean isUserBlockedFromRequesting(String userEmail, OtpType type);

    Long getBlockExpiryTime(String userEmail, OtpType type);

    @PreDestroy
    void shutdown();
}
