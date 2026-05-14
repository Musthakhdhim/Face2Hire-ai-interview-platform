package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.OtpData;
import com.aiinterview.face2hire_backend.entity.OtpType;
import com.aiinterview.face2hire_backend.service.OtpService;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class OtpServiceImpl implements OtpService {

    private final Cache<String, OtpData> otpCache;

    private final Map<String, Boolean> verifiedOtps;

    private final Map<String, Integer> otpRequestCounts;

    private final Map<String, Long> otpRequestBlockedUntil;

    private final Map<String, Integer> failedAttempts;

    private final ScheduledExecutorService scheduler;

    private final SecureRandom secureRandom;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_SECONDS = 180; // 3 minutes
    private static final int MAX_OTP_REQUESTS_PER_HOUR = 3;
    private static final int BLOCK_DURATION_MINUTES = 15;
    private static final int MAX_FAILED_ATTEMPTS = 3;
    private static final int FAILED_ATTEMPTS_WINDOW_MINUTES = 5;
    private static final int CLEANUP_INTERVAL_SECONDS = 30;
    private static final int MAX_CACHE_SIZE = 10000;

    public OtpServiceImpl() {
        this.otpCache = Caffeine.newBuilder()
                .expireAfterWrite(OTP_EXPIRY_SECONDS, TimeUnit.SECONDS)
                .maximumSize(MAX_CACHE_SIZE)
                .recordStats()
                .build();

        this.verifiedOtps = new ConcurrentHashMap<>();
        this.otpRequestCounts = new ConcurrentHashMap<>();
        this.otpRequestBlockedUntil = new ConcurrentHashMap<>();
        this.failedAttempts = new ConcurrentHashMap<>();

        this.scheduler = Executors.newSingleThreadScheduledExecutor();

        this.secureRandom = new SecureRandom();

        log.info("OtpService initialized with expiry: {} seconds, max requests: {}/hour",
                OTP_EXPIRY_SECONDS, MAX_OTP_REQUESTS_PER_HOUR);
    }

    @PostConstruct
    @Override
    public void startCleanup() {
        scheduler.scheduleAtFixedRate(this::cleanupExpiredEntries,
                CLEANUP_INTERVAL_SECONDS,
                CLEANUP_INTERVAL_SECONDS,
                TimeUnit.SECONDS);
        log.info("OTP cleanup scheduler started");
    }

    @Override
    public String generateOtp(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);

        if (!canRequestOtp(userEmail, type)) {
            Long blockedUntil = otpRequestBlockedUntil.get(identifier);
            long remainingSeconds = (blockedUntil - System.currentTimeMillis()) / 1000;
            throw new RuntimeException("Too many OTP requests. Please try again after " +
                    remainingSeconds + " seconds.");
        }

        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));

        OtpData otpData = OtpData.builder()
                .otp(otp)
                .generatedAt(System.currentTimeMillis())
                .expirySeconds(OTP_EXPIRY_SECONDS)
                .type(type)
                .attempts(0)
                .build();

        otpCache.put(identifier, otpData);

        incrementOtpRequestCount(userEmail, type);

        clearVerifiedOtp(userEmail, type);
        clearFailedAttempts(userEmail, type);

        log.info("OTP generated for {} ({}): {}", userEmail, type, otp);

        return otp;
    }


    @Override
    public boolean validateOtp(String userEmail, OtpType type, String otp) {
        String identifier = buildIdentifier(userEmail, type);

        if (isUserBlocked(userEmail, type)) {
            log.warn("User {} is blocked for {} OTP validation", userEmail, type);
            return false;
        }

        OtpData otpData = otpCache.getIfPresent(identifier);

        if (otpData == null) {
            recordFailedAttempt(userEmail, type);
            log.warn("OTP validation failed for {} ({}): OTP not found", userEmail, type);
            return false;
        }

        long elapsed = System.currentTimeMillis() - otpData.getGeneratedAt();
        if (elapsed > otpData.getExpirySeconds() * 1000L) {
            otpCache.invalidate(identifier);
            recordFailedAttempt(userEmail, type);
            log.warn("OTP validation failed for {} ({}): OTP expired", userEmail, type);
            return false;
        }

        if (!otpData.getOtp().equals(otp)) {
            recordFailedAttempt(userEmail, type);
            log.warn("OTP validation failed for {} ({}): Invalid OTP", userEmail, type);
            return false;
        }

        otpCache.invalidate(identifier);
        clearFailedAttempts(userEmail, type);

        log.info("OTP validated successfully for {} ({})", userEmail, type);
        return true;
    }


    @Override
    public void markOtpVerified(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        verifiedOtps.put(identifier, true);
        log.info("OTP marked as verified for {} ({})", userEmail, type);
    }


    @Override
    public boolean isOtpVerified(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        return verifiedOtps.getOrDefault(identifier, false);
    }


    @Override
    public void clearVerifiedOtp(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        verifiedOtps.remove(identifier);
        log.debug("Verified OTP cleared for {} ({})", userEmail, type);
    }


    @Override
    public boolean canRequestOtp(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);

        Long blockedUntil = otpRequestBlockedUntil.get(identifier);
        if (blockedUntil != null && System.currentTimeMillis() < blockedUntil) {
            long remainingSeconds = (blockedUntil - System.currentTimeMillis()) / 1000;
            log.debug("OTP request blocked for {} ({}): {} seconds remaining",
                    userEmail, type, remainingSeconds);
            return false;
        }

        if (blockedUntil != null && System.currentTimeMillis() >= blockedUntil) {
            otpRequestBlockedUntil.remove(identifier);
            otpRequestCounts.remove(identifier);
        }

        Integer count = otpRequestCounts.getOrDefault(identifier, 0);
        if (count >= MAX_OTP_REQUESTS_PER_HOUR) {
            long blockUntil = System.currentTimeMillis() + (BLOCK_DURATION_MINUTES * 60 * 1000);
            otpRequestBlockedUntil.put(identifier, blockUntil);
            log.warn("OTP request limit exceeded for {} ({}). Blocked until {}",
                    userEmail, type, LocalDateTime.now().plusMinutes(BLOCK_DURATION_MINUTES));
            return false;
        }

        return true;
    }

    @Override
    public long getRemainingBlockTime(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        Long blockedUntil = otpRequestBlockedUntil.get(identifier);

        if (blockedUntil == null || System.currentTimeMillis() >= blockedUntil) {
            return 0;
        }

        return (blockedUntil - System.currentTimeMillis()) / 1000;
    }

    @Override
    public void incrementOtpRequestCount(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        otpRequestCounts.merge(identifier, 1, Integer::sum);

        scheduler.schedule(() -> {
            otpRequestCounts.remove(identifier);
            otpRequestBlockedUntil.remove(identifier);
            log.debug("OTP request count reset for {} ({})", userEmail, type);
        }, 1, TimeUnit.HOURS);
    }


    @Override
    public boolean isOtpValid(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        OtpData otpData = otpCache.getIfPresent(identifier);

        if (otpData == null) {
            return false;
        }

        long elapsed = System.currentTimeMillis() - otpData.getGeneratedAt();
        return elapsed <= otpData.getExpirySeconds() * 1000L;
    }


    @Override
    public long getOtpRemainingSeconds(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        OtpData otpData = otpCache.getIfPresent(identifier);

        if (otpData == null) {
            return 0;
        }

        long elapsed = System.currentTimeMillis() - otpData.getGeneratedAt();
        long remaining = otpData.getExpirySeconds() - (elapsed / 1000);
        return Math.max(0, remaining);
    }

    @Override
    public void invalidateOtp(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        otpCache.invalidate(identifier);
        clearVerifiedOtp(userEmail, type);
        clearFailedAttempts(userEmail, type);
        log.info("OTP invalidated for {} ({})", userEmail, type);
    }


    @Override
    public void recordFailedAttempt(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        int attempts = failedAttempts.getOrDefault(identifier, 0) + 1;
        failedAttempts.put(identifier, attempts);

        scheduler.schedule(() -> {
            clearFailedAttempts(userEmail, type);
        }, FAILED_ATTEMPTS_WINDOW_MINUTES, TimeUnit.MINUTES);

        log.warn("Failed OTP attempt {} for {} ({})", attempts, userEmail, type);
    }


    @Override
    public void clearFailedAttempts(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        failedAttempts.remove(identifier);
    }


    @Override
    public boolean isUserBlocked(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        Integer attempts = failedAttempts.get(identifier);
        return attempts != null && attempts >= MAX_FAILED_ATTEMPTS;
    }

    @Override
    public int getRemainingFailedAttempts(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        Integer attempts = failedAttempts.get(identifier);
        if (attempts == null) {
            return MAX_FAILED_ATTEMPTS;
        }
        return Math.max(0, MAX_FAILED_ATTEMPTS - attempts);
    }

    @Override
    public void cleanupExpiredEntries() {
        long now = System.currentTimeMillis();
        int cleaned = 0;


        for (Map.Entry<String, Long> entry : otpRequestBlockedUntil.entrySet()) {
            if (now >= entry.getValue()) {
                otpRequestBlockedUntil.remove(entry.getKey());
                otpRequestCounts.remove(entry.getKey());
                cleaned++;
            }
        }


        if (cleaned > 0) {
            log.debug("Cleaned up {} expired entries from rate limiting maps", cleaned);
        }
    }

    @Override
    public String buildIdentifier(String userEmail, OtpType type) {
        return String.format("%s:%s", userEmail.toLowerCase().trim(), type.name());
    }

    @Override
    public String getCacheStats() {
        return String.format("Cache size: %d, Hit rate: %.2f%%, Miss rate: %.2f%%, Evictions: %d",
                otpCache.estimatedSize(),
                otpCache.stats().hitRate() * 100,
                otpCache.stats().missRate() * 100,
                otpCache.stats().evictionCount());
    }


    @Override
    public int getRequestCount(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        return otpRequestCounts.getOrDefault(identifier, 0);
    }


    @Override
    public boolean isUserBlockedFromRequesting(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        Long blockedUntil = otpRequestBlockedUntil.get(identifier);
        return blockedUntil != null && System.currentTimeMillis() < blockedUntil;
    }

    @Override
    public Long getBlockExpiryTime(String userEmail, OtpType type) {
        String identifier = buildIdentifier(userEmail, type);
        return otpRequestBlockedUntil.get(identifier);
    }

    @PreDestroy
    @Override
    public void shutdown() {
        log.info("Shutting down OtpService...");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }

        otpCache.invalidateAll();
        verifiedOtps.clear();
        otpRequestCounts.clear();
        otpRequestBlockedUntil.clear();
        failedAttempts.clear();

        log.info("OtpService shutdown complete");
    }
}