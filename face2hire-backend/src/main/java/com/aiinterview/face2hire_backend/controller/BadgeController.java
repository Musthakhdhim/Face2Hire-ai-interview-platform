package com.aiinterview.face2hire_backend.controller;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.aiinterview.face2hire_backend.dto.BadgeDto;
import com.aiinterview.face2hire_backend.service.BadgeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/badges")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class BadgeController {

    private final BadgeService badgeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BadgeDto>>> getAllBadges() {
        List<BadgeDto> badges = badgeService.getAllBadges();
        ApiResponse<List<BadgeDto>> response = ApiResponse.<List<BadgeDto>>builder()
                .success(true)
                .message("Badges retrieved")
                .data(badges)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Page<BadgeDto>>> getBadges(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<BadgeDto> badges = badgeService.getBadgesByType(type, page, size);
        ApiResponse<Page<BadgeDto>> response = ApiResponse.<Page<BadgeDto>>builder()
                .success(true)
                .message("Badges retrieved")
                .data(badges)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BadgeDto>> createBadge(@Valid @RequestBody BadgeDto dto) {
        BadgeDto created = badgeService.createBadge(dto);
        ApiResponse<BadgeDto> response = ApiResponse.<BadgeDto>builder()
                .success(true)
                .message("Badge created")
                .data(created)
                .statusCode(HttpStatus.CREATED.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BadgeDto>> updateBadge(@PathVariable Long id, @Valid @RequestBody BadgeDto dto) {
        BadgeDto updated = badgeService.updateBadge(id, dto);
        ApiResponse<BadgeDto> response = ApiResponse.<BadgeDto>builder()
                .success(true)
                .message("Badge updated")
                .data(updated)
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBadge(@PathVariable Long id) {
        badgeService.deleteBadge(id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Badge deleted")
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/award")
    public ResponseEntity<ApiResponse<Void>> awardBadge(@RequestParam Long userId, @RequestParam Long badgeId) {
        badgeService.awardBadgeToUser(userId, badgeId);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Badge awarded")
                .statusCode(HttpStatus.OK.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(response);
    }
}
