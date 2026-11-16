package com.aiinterview.face2hire_backend.controller.interview;

import com.aiinterview.face2hire_backend.dto.interview.ScheduledInterviewDto;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.service.interview.ScheduledInterviewService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/v1/live-room")
@RequiredArgsConstructor
public class LiveInterviewRoomController {

    private final ScheduledInterviewService scheduledInterviewService;
    private final Map<Long, RoomSession> rooms = new ConcurrentHashMap<>();

    @PostMapping("/{scheduledId}/join")
    public ResponseEntity<RoomStateResponse> joinRoom(
            @PathVariable Long scheduledId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        ScheduledInterviewDto scheduled = scheduledInterviewService.getById(scheduledId);

        RoomSession room = rooms.computeIfAbsent(scheduledId, id -> new RoomSession());
        String displayName = user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : user.getUserName();
        String roleLabel = user.getRole() != null ? user.getRole().name() : "PARTICIPANT";

        if ("ROLE_INTERVIEWER".equalsIgnoreCase(roleLabel) && !Boolean.TRUE.equals(scheduled.getCompleted())) {
            room.setRoomEnded(false);
        }

        ParticipantInfo participant = ParticipantInfo.builder()
                .userId(user.getId())
                .name(displayName)
                .email(user.getEmail())
                .role(roleLabel)
                .audioEnabled(true)
                .videoEnabled(true)
                .lastSeenEpochMs(Instant.now().toEpochMilli())
                .build();

        room.getParticipants().put(user.getId(), participant);

        for (Long otherUserId : room.getParticipants().keySet()) {
            if (!otherUserId.equals(user.getId())) {
                room.addSignalForUser(otherUserId, SignalMessage.builder()
                        .senderId(user.getId())
                        .senderName(displayName)
                        .type("PEER_JOINED")
                        .data("{}")
                        .timestamp(Instant.now().toEpochMilli())
                        .build());
            }
        }

        return ResponseEntity.ok(buildStateResponse(room, user.getId(), scheduled));
    }

    @GetMapping("/{scheduledId}/state")
    public ResponseEntity<RoomStateResponse> getRoomState(
            @PathVariable Long scheduledId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        ScheduledInterviewDto scheduled = scheduledInterviewService.getById(scheduledId);
        RoomSession room = rooms.computeIfAbsent(scheduledId, id -> new RoomSession());

        ParticipantInfo existing = room.getParticipants().get(user.getId());
        if (existing != null) {
            existing.setLastSeenEpochMs(Instant.now().toEpochMilli());
        }

        long cutoff = Instant.now().toEpochMilli() - 20000L;
        room.getParticipants().entrySet().removeIf(entry -> entry.getValue().getLastSeenEpochMs() < cutoff);

        return ResponseEntity.ok(buildStateResponse(room, user.getId(), scheduled));
    }

    @PostMapping("/{scheduledId}/signal")
    public ResponseEntity<Void> sendSignal(
            @PathVariable Long scheduledId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody SignalRequest request) {
        User user = userDetails.getUser();
        RoomSession room = rooms.computeIfAbsent(scheduledId, id -> new RoomSession());

        String displayName = user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : user.getUserName();

        ParticipantInfo me = room.getParticipants().get(user.getId());
        if (me != null) {
            me.setLastSeenEpochMs(Instant.now().toEpochMilli());
            if (request.getAudioEnabled() != null) {
                me.setAudioEnabled(request.getAudioEnabled());
            }
            if (request.getVideoEnabled() != null) {
                me.setVideoEnabled(request.getVideoEnabled());
            }
        }

        if ("CHAT".equalsIgnoreCase(request.getType())) {
            room.getMessages().add(ChatMessage.builder()
                    .senderId(user.getId())
                    .senderName(displayName)
                    .senderRole(user.getRole() != null ? user.getRole().name() : "")
                    .text(request.getData())
                    .timestamp(Instant.now().toEpochMilli())
                    .build());
            return ResponseEntity.ok().build();
        }

        if ("MEDIA_STATE".equalsIgnoreCase(request.getType())) {
            return ResponseEntity.ok().build();
        }

        SignalMessage msg = SignalMessage.builder()
                .senderId(user.getId())
                .senderName(displayName)
                .type(request.getType())
                .data(request.getData())
                .timestamp(Instant.now().toEpochMilli())
                .build();

        for (Long targetUserId : room.getParticipants().keySet()) {
            if (!targetUserId.equals(user.getId())) {
                room.addSignalForUser(targetUserId, msg);
            }
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{scheduledId}/leave")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable Long scheduledId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        RoomSession room = rooms.get(scheduledId);
        if (room != null) {
            room.getParticipants().remove(user.getId());
            for (Long targetUserId : room.getParticipants().keySet()) {
                room.addSignalForUser(targetUserId, SignalMessage.builder()
                        .senderId(user.getId())
                        .senderName(user.getUserName())
                        .type("PEER_LEFT")
                        .data("{}")
                        .timestamp(Instant.now().toEpochMilli())
                        .build());
            }
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{scheduledId}/end")
    public ResponseEntity<ScheduledInterviewDto> endInterviewForAll(
            @PathVariable Long scheduledId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        RoomSession room = rooms.computeIfAbsent(scheduledId, id -> new RoomSession());
        room.setRoomEnded(true);
        ScheduledInterviewDto updated = scheduledInterviewService.endLiveCall(scheduledId);
        return ResponseEntity.ok(updated);
    }

    private RoomStateResponse buildStateResponse(
            RoomSession room, Long userId, ScheduledInterviewDto scheduled) {
        List<SignalMessage> drained = room.drainSignalsForUser(userId);
        boolean ended = room.isRoomEnded() || Boolean.TRUE.equals(scheduled.getCallEnded());
        return RoomStateResponse.builder()
                .roomEnded(ended)
                .participants(new ArrayList<>(room.getParticipants().values()))
                .signals(drained)
                .messages(new ArrayList<>(room.getMessages()))
                .build();
    }

    @Data
    public static class RoomSession {
        private volatile boolean roomEnded = false;
        private final Map<Long, ParticipantInfo> participants = new ConcurrentHashMap<>();
        private final Map<Long, List<SignalMessage>> signalQueues = new ConcurrentHashMap<>();
        private final List<ChatMessage> messages = new CopyOnWriteArrayList<>();

        public void addSignalForUser(Long targetUserId, SignalMessage message) {
            List<SignalMessage> queue = signalQueues.computeIfAbsent(
                    targetUserId, k -> new CopyOnWriteArrayList<>());
            queue.add(message);
        }

        public List<SignalMessage> drainSignalsForUser(Long targetUserId) {
            List<SignalMessage> queue = signalQueues.get(targetUserId);
            if (queue == null || queue.isEmpty()) {
                return List.of();
            }
            List<SignalMessage> copy = new ArrayList<>(queue);
            queue.clear();
            return copy;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantInfo {
        private Long userId;
        private String name;
        private String email;
        private String role;
        private boolean audioEnabled;
        private boolean videoEnabled;
        private long lastSeenEpochMs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignalMessage {
        private Long senderId;
        private String senderName;
        private String type;
        private String data;
        private long timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessage {
        private Long senderId;
        private String senderName;
        private String senderRole;
        private String text;
        private long timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignalRequest {
        private String type;
        private String data;
        private Boolean audioEnabled;
        private Boolean videoEnabled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomStateResponse {
        private boolean roomEnded;
        private List<ParticipantInfo> participants;
        private List<SignalMessage> signals;
        private List<ChatMessage> messages;
    }
}
