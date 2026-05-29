package com.aiinterview.face2hire_backend.controller.interview;

import com.aiinterview.face2hire_backend.dto.interview.SessionStateDto;
import com.aiinterview.face2hire_backend.service.interview.InterviewSessionManager;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class InterviewWebSocketController {

    private final InterviewSessionManager sessionManager;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/interview.join")
    public void join(@Payload Long sessionId, @AuthenticationPrincipal UserDetails user) {
        Long userId = Long.valueOf(user.getUsername());
        SessionStateDto state = sessionManager.getSessionState(sessionId, userId);
        messagingTemplate.convertAndSendToUser(user.getUsername(), "/queue/interview.state", state);
    }
}
