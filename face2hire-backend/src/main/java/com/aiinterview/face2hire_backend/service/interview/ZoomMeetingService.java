package com.aiinterview.face2hire_backend.service.interview;

import com.aiinterview.face2hire_backend.dto.interview.ZoomMeetingDetailsDto;
import java.time.LocalDateTime;

public interface ZoomMeetingService {
    ZoomMeetingDetailsDto createMeeting(String topic, LocalDateTime startTime, int durationMinutes);
}
