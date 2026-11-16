package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.ZoomMeetingDetailsDto;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.service.interview.ZoomMeetingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ZoomMeetingServiceImpl implements ZoomMeetingService {

    private final ObjectMapper objectMapper;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @Value("${zoom.account-id:local-zoom-account-id}")
    private String zoomAccountId;

    @Value("${zoom.client-id:local-zoom-client-id}")
    private String zoomClientId;

    @Value("${zoom.client-secret:local-zoom-client-secret}")
    private String zoomClientSecret;

    @Value("${zoom.timezone:Asia/Kolkata}")
    private String zoomTimezone;

    private String cachedAccessToken;
    private Instant tokenExpiresAt = Instant.MIN;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Override
    public ZoomMeetingDetailsDto createMeeting(String topic, LocalDateTime startTime, int durationMinutes) {
        if (isPlaceholderCredentials()) {
            log.warn("Zoom credentials are not configured; generating fallback Zoom meeting links for testing.");
            return createFallbackMeeting(startTime);
        }

        try {
            String accessToken = getAccessToken();
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);

            int safeDuration = Math.min(Math.max(durationMinutes, 15), 40);
            String formattedStart = startTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));

            Map<String, Object> settings = new HashMap<>();
            settings.put("host_video", true);
            settings.put("participant_video", true);
            settings.put("join_before_host", true);
            settings.put("waiting_room", false);

            Map<String, Object> body = new HashMap<>();
            body.put("topic", topic);
            body.put("type", 2);
            body.put("start_time", formattedStart);
            body.put("duration", safeDuration);
            body.put("timezone", zoomTimezone);
            body.put("settings", settings);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.zoom.us/v2/users/me/meetings",
                    entity,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String meetingId = root.path("id").asText();
            String joinUrl = root.path("join_url").asText();
            String startUrl = root.path("start_url").asText();
            String passcode = root.path("password").asText("");

            log.info("Created Zoom meeting {} for topic '{}'", meetingId, topic);
            return ZoomMeetingDetailsDto.builder()
                    .meetingId(meetingId)
                    .joinUrl(joinUrl)
                    .startUrl(startUrl)
                    .passcode(passcode)
                    .build();
        } catch (Exception e) {
            log.error("Failed to create Zoom meeting via API ({}), using fallback meeting link", e.getMessage());
            return createFallbackMeeting(startTime);
        }
    }

    private synchronized String getAccessToken() throws Exception {
        if (cachedAccessToken != null && Instant.now().isBefore(tokenExpiresAt.minusSeconds(60))) {
            return cachedAccessToken;
        }

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String auth = zoomClientId + ":" + zoomClientSecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);

        String tokenUrl = "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" + zoomAccountId;
        HttpEntity<String> entity = new HttpEntity<>("", headers);

        ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, entity, String.class);
        JsonNode root = objectMapper.readTree(response.getBody());
        cachedAccessToken = root.path("access_token").asText();
        long expiresIn = root.path("expires_in").asLong(3600L);
        tokenExpiresAt = Instant.now().plusSeconds(expiresIn);

        log.info("Successfully obtained Zoom Server-to-Server OAuth access token");
        return cachedAccessToken;
    }

    private boolean isPlaceholderCredentials() {
        return zoomAccountId == null || zoomAccountId.isBlank()
                || zoomAccountId.startsWith("local-")
                || zoomAccountId.startsWith("dev-")
                || zoomAccountId.startsWith("prod-")
                || zoomAccountId.startsWith("test-")
                || zoomClientId == null || zoomClientId.isBlank()
                || zoomClientId.startsWith("local-");
    }

    private ZoomMeetingDetailsDto createFallbackMeeting(LocalDateTime startTime) {
        String numericId = String.valueOf(Math.abs(UUID.randomUUID().getMostSignificantBits())).substring(0, 10);
        String passcode = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
        String joinUrl = "https://zoom.us/j/" + numericId + "?pwd=" + passcode;
        String startUrl = joinUrl + "&role=host";
        log.info("Generated fallback Zoom meeting ID={} scheduled for {}", numericId, startTime);
        return ZoomMeetingDetailsDto.builder()
                .meetingId(numericId)
                .joinUrl(joinUrl)
                .startUrl(startUrl)
                .passcode(passcode)
                .build();
    }
}
