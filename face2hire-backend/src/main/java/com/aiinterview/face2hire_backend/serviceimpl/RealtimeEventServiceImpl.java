package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.RealtimeEventDto;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.service.RealtimeEventService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RealtimeEventServiceImpl implements RealtimeEventService {

    private final SimpMessagingTemplate messagingTemplate;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Override
    public void publishToTopic(String topic, String eventType, Long entityId, Object payload) {
        try {
            RealtimeEventDto event = RealtimeEventDto.builder()
                    .eventType(eventType)
                    .entityId(entityId)
                    .payload(payload)
                    .timestamp(LocalDateTime.now())
                    .build();
            messagingTemplate.convertAndSend(topic, event);
            log.debug("Published realtime event {} to {}", eventType, topic);
        } catch (Exception e) {
            log.warn("Failed to publish realtime event {} to {}: {}", eventType, topic, e.getMessage());
        }
    }

    @Override
    public void publishJobEvent(String eventType, Long jobId, Object payload) {
        publishToTopic("/topic/jobs", eventType, jobId, payload);
    }

    @Override
    public void publishApplicationEvent(
            String eventType, Long applicationId, Long candidateId, Long interviewerId, Object payload) {
        if (applicationId != null) {
            publishToTopic("/topic/application/" + applicationId + "/stages", eventType, applicationId, payload);
        }
        if (candidateId != null) {
            publishToTopic("/topic/user/" + candidateId + "/applications", eventType, applicationId, payload);
        }
        if (interviewerId != null) {
            publishToTopic("/topic/user/" + interviewerId + "/applications", eventType, applicationId, payload);
        }
        publishToTopic("/topic/interviewer/applications", eventType, applicationId, payload);
    }

    @Override
    public void publishInterviewEvent(
            String eventType, Long scheduledId, Long candidateId, Long applicationId, Object payload) {
        if (scheduledId != null) {
            publishToTopic("/topic/live-room/" + scheduledId, eventType, scheduledId, payload);
        }
        if (candidateId != null) {
            publishToTopic("/topic/user/" + candidateId + "/interviews", eventType, scheduledId, payload);
            publishToTopic("/topic/user/" + candidateId + "/applications", eventType, applicationId, payload);
        }
        if (applicationId != null) {
            publishToTopic("/topic/application/" + applicationId + "/stages", eventType, applicationId, payload);
        }
        publishToTopic("/topic/interviewer/interviews", eventType, scheduledId, payload);
    }

    @Override
    public void publishNotificationEvent(Long userId, Object notificationDto) {
        if (userId != null) {
            publishToTopic("/topic/user/" + userId + "/notifications", "NOTIFICATION_CREATED", userId, notificationDto);
        }
    }
}
