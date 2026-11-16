package com.aiinterview.face2hire_backend.service;

public interface RealtimeEventService {
    void publishToTopic(String topic, String eventType, Long entityId, Object payload);

    void publishJobEvent(String eventType, Long jobId, Object payload);

    void publishApplicationEvent(
            String eventType, Long applicationId, Long candidateId, Long interviewerId, Object payload);

    void publishInterviewEvent(
            String eventType, Long scheduledId, Long candidateId, Long applicationId, Object payload);

    void publishNotificationEvent(Long userId, Object notificationDto);
}
