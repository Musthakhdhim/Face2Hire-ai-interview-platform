package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.ScheduleInterviewRequest;
import com.aiinterview.face2hire_backend.dto.interview.ScheduledInterviewDto;
import com.aiinterview.face2hire_backend.entity.ActivityAction;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.entity.interview.ScheduledInterview;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.repository.interview.ScheduledInterviewRepository;
import com.aiinterview.face2hire_backend.service.ActivityLogService;
import com.aiinterview.face2hire_backend.service.BadgeService;
import com.aiinterview.face2hire_backend.service.NotificationService;
import com.aiinterview.face2hire_backend.service.interview.ScheduledInterviewService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduledInterviewServiceImpl implements ScheduledInterviewService {

    private final ScheduledInterviewRepository repository;
    private final InterviewSessionRepository sessionRepository;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;
    private final BadgeService badgeService;
    private final NotificationService notificationService;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @Override
    public ScheduledInterviewDto schedule(String interviewerName, ScheduleInterviewRequest request) {


        ScheduledInterview entity = ScheduledInterview.builder()
                .intervieweeId(request.getIntervieweeId())
                .intervieweeName(request.getIntervieweeName())
                .type(request.getType())
                .difficulty(request.getDifficulty())
                .duration(request.getDuration())
                .questionCount(request.getQuestionCount())
                .avatarStyle(request.getAvatarStyle())
                .scheduledByInterviewer(interviewerName)
                .dueDate(request.getDueDate().atTime(LocalTime.MAX))
                .applicationId(request.getApplicationId())      // new
                .minimumScore(request.getMinimumScore())
                .build();
        entity = repository.save(entity);

        notificationService.createNotification(
                request.getIntervieweeId(),
                "Interview Scheduled",
                "An interview has been scheduled for you by " + interviewerName + ". Type: " + request.getType() + ", Due: " + request.getDueDate(),
                "INTERVIEW_SCHEDULED"
        );

        User interviewee = userRepository.findById(request.getIntervieweeId()).orElse(null);
        if (interviewee != null) {
            activityLogService.log(interviewee, ActivityAction.INTERVIEW_SCHEDULED,
                    String.format("Interview scheduled by %s | Type: %s | Due: %s",
                            interviewerName, request.getType(), request.getDueDate()));
        }

        User interviewer = userRepository.findByEmail(interviewerName);
        if (interviewer != null) {
            try {
                badgeService.checkAndAwardBadges(interviewer.getId());
            } catch (Exception e) {
                log.warn("Failed to check badges for interviewer {}: {}", interviewerName, e.getMessage());
            }
        }
        return toDto(entity);
    }
    private ScheduledInterviewDto toDto(ScheduledInterview entity) {
        boolean completed = sessionRepository.existsByScheduledInterviewIdAndStatus(entity.getId(), SessionStatus.COMPLETED);
        return toDto(entity, completed);
    }

    @Override
    public List<ScheduledInterviewDto> getForUser(Long userId) {
        List<ScheduledInterview> list = repository.findByIntervieweeId(userId);
        log.info("Found {} scheduled interviews for user {}", list.size(), userId);
        List<ScheduledInterviewDto> result = new ArrayList<>();
        for (ScheduledInterview entity : list) {
            try {
                result.add(toDto(entity));
            } catch (Exception e) {
                log.error("Failed to convert scheduled interview {}: {}", entity.getId(), e.getMessage(), e);
            }
        }
        return result;
    }

    @Override
    public List<ScheduledInterviewDto> getByInterviewer(String interviewerName) {
        List<ScheduledInterview> list = repository.findByScheduledByInterviewer(interviewerName);
        log.info("Found {} scheduled interviews for interviewer {}", list.size(), interviewerName);
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public ScheduledInterviewDto getByApplicationId(Long applicationId) {
        ScheduledInterview entity = repository.findByApplicationId(applicationId)
                .orElseThrow(() -> new RuntimeException("No scheduled interview found for application " + applicationId));
        return toDto(entity);
    }

    @Override
    public ScheduledInterviewDto getById(Long id) {
        ScheduledInterview entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Scheduled interview not found"));
        boolean completed = sessionRepository.existsByScheduledInterviewIdAndStatus(id, SessionStatus.COMPLETED);
        return toDto(entity, completed);
    }

    private ScheduledInterviewDto toDto(ScheduledInterview entity, boolean completed) {
        return ScheduledInterviewDto.builder()
                .id(entity.getId())
                .intervieweeId(entity.getIntervieweeId())
                .intervieweeName(entity.getIntervieweeName())
                .type(entity.getType())
                .difficulty(entity.getDifficulty())
                .duration(entity.getDuration())
                .questionCount(entity.getQuestionCount())
                .avatarStyle(entity.getAvatarStyle())
                .scheduledByInterviewer(entity.getScheduledByInterviewer())
                .dueDate(entity.getDueDate())
                .createdAt(entity.getCreatedAt())
                .applicationId(entity.getApplicationId())
                .minimumScore(entity.getMinimumScore())
                .completed(completed)
                .build();
    }

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }
}
