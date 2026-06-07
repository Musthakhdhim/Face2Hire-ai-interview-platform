package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.dto.ActivityLogDto;
import com.aiinterview.face2hire_backend.dto.ActivityLogFilterRequest;
import com.aiinterview.face2hire_backend.entity.ActivityAction;
import com.aiinterview.face2hire_backend.entity.User;
import org.springframework.data.domain.Page;
import java.util.List;

public interface ActivityLogService {
    void log(User user, ActivityAction action, String description);
    List<ActivityLogDto> getRecentActivities();
    Page<ActivityLogDto> getFilteredActivities(ActivityLogFilterRequest filter);
}