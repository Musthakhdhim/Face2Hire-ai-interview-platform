package com.aiinterview.face2hire_backend.service.interview;

import com.aiinterview.face2hire_backend.dto.interview.ScheduleInterviewRequest;
import com.aiinterview.face2hire_backend.dto.interview.ScheduledInterviewDto;
import java.util.List;

public interface ScheduledInterviewService {
    ScheduledInterviewDto schedule(String interviewerName, ScheduleInterviewRequest request);
    List<ScheduledInterviewDto> getForUser(Long userId);
    List<ScheduledInterviewDto> getByInterviewer(String interviewerName);
    ScheduledInterviewDto getByApplicationId(Long applicationId);
    ScheduledInterviewDto getById(Long id);
    ScheduledInterviewDto getByStageId(Long stageId);

}