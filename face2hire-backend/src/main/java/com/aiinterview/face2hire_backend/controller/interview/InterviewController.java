package com.aiinterview.face2hire_backend.controller.interview;

import com.aiinterview.face2hire_backend.dto.interview.*;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.serviceimpl.interview.InterviewOrchestratorImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewOrchestratorImpl orchestrator;

    @PostMapping("/start")
    public ResponseEntity<SessionStartedDto> start(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody StartSessionRequest request) throws JsonProcessingException {
        Long userId = Long.valueOf(user.getUsername());
        return ResponseEntity.ok(orchestrator.start(userId, request));
    }

    @PostMapping("/submit-answer")
    public ResponseEntity<FeedbackResponseDto> submitAnswer(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody AnswerSubmissionDto dto) throws JsonProcessingException {
        Long userId = Long.valueOf(user.getUsername());
        return ResponseEntity.ok(orchestrator.submitAnswer(userId, dto));
    }

    @GetMapping("/next-question/{sessionId}/{currentQuestionId}")
    public ResponseEntity<QuestionResponseDto> nextQuestion(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long sessionId,
            @PathVariable Long currentQuestionId) throws JsonProcessingException {
        Long userId = Long.valueOf(user.getUsername());
        return ResponseEntity.ok(orchestrator.getNextQuestion(sessionId, currentQuestionId, userId));
    }

    @PostMapping("/end/{sessionId}")
    public ResponseEntity<OverallFeedbackDto> end(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long sessionId) throws JsonProcessingException {
        Long userId = Long.valueOf(user.getUsername());
        return ResponseEntity.ok(orchestrator.endSession(sessionId, userId));
    }

    @GetMapping("/my-sessions")
    public ResponseEntity<List<InterviewSessionDto>> getMySessions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        return ResponseEntity.ok(orchestrator.getUserSessions(userId));
    }
}