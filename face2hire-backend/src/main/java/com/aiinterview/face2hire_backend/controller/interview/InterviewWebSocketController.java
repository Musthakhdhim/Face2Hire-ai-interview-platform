package com.aiinterview.face2hire_backend.controller.interview;

import com.aiinterview.face2hire_backend.dto.interview.SessionStateDto;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.exception.UserNotFoundException;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.service.interview.InterviewSessionManager;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;

import java.security.Principal;

//@Controller
@RequiredArgsConstructor
public class InterviewWebSocketController {

    private final InterviewSessionManager sessionManager;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @MessageMapping("/interview.join")
    public void join(@Payload Long sessionId, Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email);
        Long userId = user.getId();
        SessionStateDto state = sessionManager.getSessionState(sessionId, userId);
        messagingTemplate.convertAndSendToUser(email, "/queue/interview.state", state);
    }
}
