package com.aiinterview.face2hire_backend.controller.interview;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.interview.*;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.service.interview.InterviewOrchestrator;
import com.aiinterview.face2hire_backend.service.interview.PdfReportService;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewOrchestrator orchestrator;
    private final PdfReportService pdfReportService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<SessionStartedDto>> start(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody StartSessionRequest request) throws JsonProcessingException {
        Long userId = userDetails.getUser().getId();
        SessionStartedDto dto = orchestrator.start(userId, request);
        ApiResponse<SessionStartedDto> response = ApiResponse.<SessionStartedDto>builder()
                .success(true)
                .message("Interview started successfully")
                .data(dto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/submit-answer")
    public ResponseEntity<ApiResponse<FeedbackResponseDto>> submitAnswer(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AnswerSubmissionDto dto) throws JsonProcessingException {
        Long userId = userDetails.getUser().getId();
        FeedbackResponseDto result = orchestrator.submitAnswer(userId, dto);
        ApiResponse<FeedbackResponseDto> response = ApiResponse.<FeedbackResponseDto>builder()
                .success(true)
                .message("Answer submitted")
                .data(result)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/next-question/{sessionId}/{currentQuestionId}")
    public ResponseEntity<ApiResponse<QuestionResponseDto>> nextQuestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long sessionId,
            @PathVariable Long currentQuestionId) throws JsonProcessingException {
        Long userId = userDetails.getUser().getId();
        QuestionResponseDto dto = orchestrator.getNextQuestion(sessionId, currentQuestionId, userId);
        ApiResponse<QuestionResponseDto> response = ApiResponse.<QuestionResponseDto>builder()
                .success(true)
                .message("Next question retrieved")
                .data(dto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/end/{sessionId}")
    public ResponseEntity<ApiResponse<OverallFeedbackDto>> end(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long sessionId) throws JsonProcessingException {
        Long userId = userDetails.getUser().getId();
        OverallFeedbackDto dto = orchestrator.endSession(sessionId, userId);
        ApiResponse<OverallFeedbackDto> response = ApiResponse.<OverallFeedbackDto>builder()
                .success(true)
                .message("Interview ended")
                .data(dto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-sessions")
    public ResponseEntity<ApiResponse<List<InterviewSessionDto>>> getMySessions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        List<InterviewSessionDto> sessions = orchestrator.getUserSessions(userId);
        ApiResponse<List<InterviewSessionDto>> response = ApiResponse.<List<InterviewSessionDto>>builder()
                .success(true)
                .message("Sessions retrieved")
                .data(sessions)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/feedback/{sessionId}")
    public ResponseEntity<ApiResponse<OverallFeedbackDto>> getFeedback(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long sessionId) {
        Long userId = userDetails.getUser().getId();
        System.out.println("calling getFeedback: "+userId);
        OverallFeedbackDto dto = orchestrator.getOverallFeedback(sessionId, userId);
        ApiResponse<OverallFeedbackDto> response = ApiResponse.<OverallFeedbackDto>builder()
                .success(true)
                .message("Feedback retrieved")
                .data(dto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/feedback/by-scheduled/{scheduledId}")
    public ResponseEntity<ApiResponse<OverallFeedbackDto>> getFeedbackByScheduledId(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long scheduledId) {
        Long userId = userDetails.getUser().getId();
        OverallFeedbackDto dto = orchestrator.getOverallFeedbackByScheduledId(scheduledId, userId);
        ApiResponse<OverallFeedbackDto> response = ApiResponse.<OverallFeedbackDto>builder()
                .success(true)
                .message("Feedback retrieved")
                .data(dto)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/feedback/{sessionId}/pdf")
    public ResponseEntity<byte[]> downloadFeedbackPdf(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long sessionId) throws JsonProcessingException {
        Long userId = userDetails.getUser().getId();
        OverallFeedbackDto feedback = orchestrator.getOverallFeedback(sessionId, userId);
        byte[] pdfBytes = pdfReportService.generateFeedbackPdf(feedback, sessionId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=feedback-" + sessionId + ".pdf")
                .body(pdfBytes);
    }
    @GetMapping("/session-detail/{sessionId}")
    public ResponseEntity<ApiResponse<SessionDetailDto>> getSessionDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long sessionId) {
        Long userId = userDetails.getUser().getId();
        SessionDetailDto detail = orchestrator.getSessionDetail(sessionId, userId);
        ApiResponse<SessionDetailDto> response = ApiResponse.<SessionDetailDto>builder()
                .success(true)
                .message("Session details retrieved")
                .data(detail)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}
