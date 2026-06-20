package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.*;
import com.aiinterview.face2hire_backend.entity.Application;
import com.aiinterview.face2hire_backend.entity.Job;
import com.aiinterview.face2hire_backend.repository.ApplicationRepository;
import com.aiinterview.face2hire_backend.repository.JobRepository;
import com.aiinterview.face2hire_backend.service.StageWorkflowService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/applications/stages")
@RequiredArgsConstructor
public class StageWorkflowController {

    private final StageWorkflowService stageWorkflowService;
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final ObjectMapper objectMapper;

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<ApiResponse<List<ApplicationStageDto>>> getApplicationStages(
            @PathVariable Long applicationId) {
        List<ApplicationStageDto> stages = stageWorkflowService.getApplicationStages(applicationId);
        return ResponseEntity.ok(ApiResponse.<List<ApplicationStageDto>>builder()
                .success(true)
                .message("Stages retrieved")
                .data(stages)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    @GetMapping("/application/{applicationId}/current")
    public ResponseEntity<ApiResponse<ApplicationStageDto>> getCurrentStage(
            @PathVariable Long applicationId) {
        ApplicationStageDto stage = stageWorkflowService.getCurrentStage(applicationId);
        return ResponseEntity.ok(ApiResponse.<ApplicationStageDto>builder()
                .success(true)
                .message("Current stage retrieved")
                .data(stage)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    @GetMapping("/{stageId}")
    public ResponseEntity<ApiResponse<ApplicationStageDto>> getStageById(
            @PathVariable Long stageId) {
        ApplicationStageDto stage = stageWorkflowService.getStageById(stageId);
        return ResponseEntity.ok(ApiResponse.<ApplicationStageDto>builder()
                .success(true)
                .message("Stage details retrieved")
                .data(stage)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    @PostMapping("/{stageId}/start")
    public ResponseEntity<ApiResponse<ApplicationStageDto>> startStage(
            @PathVariable Long stageId,
            @RequestParam Long applicationId,
            @RequestParam Long scheduledInterviewId) {
        ApplicationStageDto stage = stageWorkflowService.startStage(applicationId, stageId, scheduledInterviewId);
        return ResponseEntity.ok(ApiResponse.<ApplicationStageDto>builder()
                .success(true)
                .message("Stage started")
                .data(stage)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    @PostMapping("/{stageId}/approve")
    public ResponseEntity<ApiResponse<ApplicationStageDto>> approveStage(
            @PathVariable Long stageId,
            @RequestParam Long applicationId,
            @RequestParam Double score,
            @RequestBody(required = false) StageDecisionRequest request) {
        String feedback = request != null ? request.getFeedback() : null;
        ApplicationStageDto stage = stageWorkflowService.approveStage(applicationId, stageId, score, feedback);
        return ResponseEntity.ok(ApiResponse.<ApplicationStageDto>builder()
                .success(true)
                .message("Stage approved")
                .data(stage)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    @PostMapping("/{stageId}/reject")
    public ResponseEntity<ApiResponse<ApplicationStageDto>> rejectStage(
            @PathVariable Long stageId,
            @RequestParam Long applicationId,
            @RequestBody(required = false) StageDecisionRequest request) {
        String feedback = request != null ? request.getFeedback() : "Failed to meet requirements";
        ApplicationStageDto stage = stageWorkflowService.rejectStage(applicationId, stageId, feedback);
        return ResponseEntity.ok(ApiResponse.<ApplicationStageDto>builder()
                .success(true)
                .message("Stage rejected")
                .data(stage)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    @PostMapping("/{stageId}/skip")
    public ResponseEntity<ApiResponse<ApplicationStageDto>> skipStage(
            @PathVariable Long stageId,
            @RequestParam Long applicationId,
            @RequestBody(required = false) SkipStageRequest request) {
        String reason = request != null ? request.getReason() : null;
        ApplicationStageDto stage = stageWorkflowService.skipStage(applicationId, stageId, reason);
        return ResponseEntity.ok(ApiResponse.<ApplicationStageDto>builder()
                .success(true)
                .message("Stage skipped")
                .data(stage)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    @GetMapping("/application/{applicationId}/next")
    public ResponseEntity<ApiResponse<ApplicationStageDto>> getNextStage(
            @PathVariable Long applicationId) {
        ApplicationStageDto stage = stageWorkflowService.getNextStage(applicationId);
        if (stage == null) {
            return ResponseEntity.ok(ApiResponse.<ApplicationStageDto>builder()
                    .success(true)
                    .message("No next stage found")
                    .data(null)
                    .statusCode(HttpStatus.OK.value())
                    .time(LocalDateTime.now())
                    .build());
        }
        return ResponseEntity.ok(ApiResponse.<ApplicationStageDto>builder()
                .success(true)
                .message("Next stage retrieved")
                .data(stage)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    @PostMapping("/application/{applicationId}/initialize")
    public ResponseEntity<ApiResponse<List<ApplicationStageDto>>> initializeStages(
            @PathVariable Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        // Check if job has multi-round config
        Job job = jobRepository.findById(application.getJobId())
                .orElseThrow(() -> new RuntimeException("Job not found"));

        WorkflowConfigDto config = null;
        if (job.getHasMultiRound() != null && job.getHasMultiRound()) {
            config = parseWorkflowConfig(job.getWorkflowConfig());
        }

        if (config == null) {
            config = stageWorkflowService.getDefaultWorkflowConfig();
        }

        stageWorkflowService.initializeStagesForApplication(application, config);
        List<ApplicationStageDto> stages = stageWorkflowService.getApplicationStages(applicationId);

        return ResponseEntity.ok(ApiResponse.<List<ApplicationStageDto>>builder()
                .success(true)
                .message("Stages initialized successfully")
                .data(stages)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build());
    }

    /**
     * Parse workflow config from JSON string
     */
    private WorkflowConfigDto parseWorkflowConfig(String configJson) {
        try {
            if (configJson != null && !configJson.isEmpty()) {
                return objectMapper.readValue(configJson, WorkflowConfigDto.class);
            }
        } catch (JsonProcessingException e) {
            // Log error and return null
            System.err.println("Failed to parse workflow config: " + e.getMessage());
        }
        return null;
    }
}