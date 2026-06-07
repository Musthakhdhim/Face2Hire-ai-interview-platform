package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.ActivityLogDto;
import com.aiinterview.face2hire_backend.dto.ActivityLogFilterRequest;
import com.aiinterview.face2hire_backend.entity.ActivityAction;
import com.aiinterview.face2hire_backend.entity.ActivityLog;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.repository.ActivityLogRepository;
import com.aiinterview.face2hire_backend.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Override
    public void log(User user, ActivityAction action, String description) {
        if (user == null) {
            log.warn("Attempt to log activity with null user");
            return;
        }
        ActivityLog logEntry = ActivityLog.builder()
                .userId(user.getId())
                .userEmail(user.getEmail())
                .userName(user.getFullName() != null ? user.getFullName() : user.getUserName())
                .action(action)
                .description(description)
                .build();
        activityLogRepository.save(logEntry);
        log.debug("Logged activity: {} for user {}", action, user.getEmail());
    }

    @Override
    public List<ActivityLogDto> getRecentActivities() {
        return activityLogRepository.findTop7ByOrderByCreatedAtDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public Page<ActivityLogDto> getFilteredActivities(ActivityLogFilterRequest filter) {
        int page = filter.getPage() != null ? filter.getPage() : 0;
        int size = filter.getSize() != null ? filter.getSize() : 20;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<ActivityLog> logPage = activityLogRepository.findAllWithFilters(
                filter.getSearch(),
                filter.getAction(),
                pageable
        );
        return logPage.map(this::toDto);
    }

    private ActivityLogDto toDto(ActivityLog log) {
        return ActivityLogDto.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .userEmail(log.getUserEmail())
                .userName(log.getUserName())
                .action(log.getAction())
                .description(log.getDescription())
                .createdAt(log.getCreatedAt())
                .build();
    }
}