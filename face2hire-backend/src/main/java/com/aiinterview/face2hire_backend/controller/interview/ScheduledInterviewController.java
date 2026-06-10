package com.aiinterview.face2hire_backend.controller.interview;

import com.aiinterview.face2hire_backend.dto.interview.ScheduleInterviewRequest;
import com.aiinterview.face2hire_backend.dto.interview.ScheduledInterviewDto;
import com.aiinterview.face2hire_backend.security.CustomUserDetails;
import com.aiinterview.face2hire_backend.service.interview.ScheduledInterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/scheduled-interviews")
@RequiredArgsConstructor
public class ScheduledInterviewController {

    private final ScheduledInterviewService service;


    @PostMapping
    public ResponseEntity<ScheduledInterviewDto> schedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ScheduleInterviewRequest request) {
        // Use email (always present, never null)
        String interviewerName = userDetails.getUsername();
        return ResponseEntity.ok(service.schedule(interviewerName, request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ScheduledInterviewDto>> getMyScheduled(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUser().getId();
        return ResponseEntity.ok(service.getForUser(userId));
    }

    @GetMapping("/for-interviewer")
    public ResponseEntity<List<ScheduledInterviewDto>> getByInterviewer(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String interviewerName = userDetails.getUsername();
        return ResponseEntity.ok(service.getByInterviewer(interviewerName));
    }

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<ScheduledInterviewDto> getByApplicationId(@PathVariable Long applicationId) {
        return ResponseEntity.ok(service.getByApplicationId(applicationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScheduledInterviewDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }
}