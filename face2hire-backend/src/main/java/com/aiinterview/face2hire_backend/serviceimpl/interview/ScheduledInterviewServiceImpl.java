package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.StageDecisionRequest;
import com.aiinterview.face2hire_backend.dto.interview.ScheduleInterviewRequest;
import com.aiinterview.face2hire_backend.dto.interview.ScheduledInterviewDto;
import com.aiinterview.face2hire_backend.dto.interview.ZoomMeetingDetailsDto;
import com.aiinterview.face2hire_backend.entity.ActivityAction;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.entity.interview.AvatarStyle;
import com.aiinterview.face2hire_backend.entity.interview.Difficulty;
import com.aiinterview.face2hire_backend.entity.interview.InterviewFeedback;
import com.aiinterview.face2hire_backend.entity.interview.InterviewMode;
import com.aiinterview.face2hire_backend.entity.interview.InterviewSession;
import com.aiinterview.face2hire_backend.entity.interview.ScheduledInterview;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import com.aiinterview.face2hire_backend.exception.ValidationException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.ApplicationStageRepository;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.repository.interview.InterviewFeedbackRepository;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.repository.interview.ScheduledInterviewRepository;
import com.aiinterview.face2hire_backend.service.ActivityLogService;
import com.aiinterview.face2hire_backend.service.BadgeService;
import com.aiinterview.face2hire_backend.service.NotificationService;
import com.aiinterview.face2hire_backend.service.RealtimeEventService;
import com.aiinterview.face2hire_backend.service.StageWorkflowService;
import com.aiinterview.face2hire_backend.service.interview.ScheduledInterviewService;
import com.aiinterview.face2hire_backend.service.interview.ZoomMeetingService;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduledInterviewServiceImpl implements ScheduledInterviewService {

    private final ScheduledInterviewRepository repository;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewFeedbackRepository feedbackRepository;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;
    private final BadgeService badgeService;
    private final NotificationService notificationService;
    private final ApplicationStageRepository applicationStageRepository;
    private final StageWorkflowService stageWorkflowService;
    private final ZoomMeetingService zoomMeetingService;
    private final RealtimeEventService realtimeEventService;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Override
    public ScheduledInterviewDto schedule(String interviewerName, ScheduleInterviewRequest request) {
        InterviewMode mode = request.getInterviewMode() != null
                ? request.getInterviewMode()
                : InterviewMode.AI;

        int duration = request.getDuration() != null ? request.getDuration() : 30;
        Difficulty difficulty = request.getDifficulty() != null ? request.getDifficulty() : Difficulty.intermediate;
        int questionCount = request.getQuestionCount() != null ? request.getQuestionCount() : 10;
        AvatarStyle avatarStyle = request.getAvatarStyle() != null
                ? request.getAvatarStyle()
                : AvatarStyle.professional;

        LocalDateTime dueDate;
        LocalDateTime scheduledAt = null;
        String meetingId = null;
        String meetingJoinUrl = null;
        String meetingStartUrl = null;
        String meetingPasscode = null;

        if (mode == InterviewMode.ZOOM) {
            if (request.getScheduledAt() != null) {
                scheduledAt = request.getScheduledAt();
            } else if (request.getDueDate() != null) {
                scheduledAt = request.getDueDate().atTime(10, 0);
            } else {
                throw new ValidationException("Scheduled date and time are required for Zoom interview");
            }
            dueDate = scheduledAt.plusMinutes(duration);

            String candidateName = request.getIntervieweeName() != null ? request.getIntervieweeName() : "Candidate";
            String topic = String.format("Face2Hire %s Interview - %s",
                    request.getType().name().toUpperCase(), candidateName);
            ZoomMeetingDetailsDto meeting = zoomMeetingService.createMeeting(topic, scheduledAt, duration);
            meetingId = meeting.getMeetingId();
            meetingJoinUrl = meeting.getJoinUrl();
            meetingStartUrl = meeting.getStartUrl();
            meetingPasscode = meeting.getPasscode();
        } else {
            LocalDate dueDay = request.getDueDate() != null
                    ? request.getDueDate()
                    : LocalDate.now().plusDays(7);
            dueDate = dueDay.atTime(LocalTime.MAX);
        }

        ScheduledInterview entity = ScheduledInterview.builder()
                .intervieweeId(request.getIntervieweeId())
                .intervieweeName(request.getIntervieweeName())
                .type(request.getType())
                .interviewMode(mode)
                .difficulty(difficulty)
                .duration(duration)
                .questionCount(questionCount)
                .avatarStyle(avatarStyle)
                .scheduledByInterviewer(interviewerName)
                .dueDate(dueDate)
                .scheduledAt(scheduledAt)
                .meetingId(meetingId)
                .meetingJoinUrl(meetingJoinUrl)
                .meetingStartUrl(meetingStartUrl)
                .meetingPasscode(meetingPasscode)
                .liveCompleted(false)
                .applicationId(request.getApplicationId())
                .minimumScore(request.getMinimumScore())
                .stageId(request.getStageId())
                .applicationStageId(request.getApplicationStageId())
                .build();
        entity = repository.save(entity);

        Long targetStageId = request.getApplicationStageId() != null
                ? request.getApplicationStageId()
                : request.getStageId();
        if (targetStageId != null) {
            applicationStageRepository.findById(targetStageId).ifPresent(stage -> {
                if (request.getMinimumScore() != null) {
                    stage.setMinimumScore(request.getMinimumScore());
                }
                stage.setInterviewMode(mode);
                applicationStageRepository.save(stage);
                log.info("Updated stage {} mode to {} and minimum score to {}",
                        targetStageId, mode, request.getMinimumScore());
            });
        }

        String scheduleTimeLabel = mode == InterviewMode.ZOOM && scheduledAt != null
                ? "Scheduled at: " + scheduledAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                : "Due: " + dueDate.toLocalDate();

        String modeLabel = mode == InterviewMode.ZOOM ? "Live Zoom Interview" : "AI Interview";

        notificationService.createNotification(
                request.getIntervieweeId(),
                modeLabel + " Scheduled",
                String.format("A %s (%s) has been scheduled for you by %s. %s",
                        modeLabel, request.getType(), interviewerName, scheduleTimeLabel),
                "INTERVIEW_SCHEDULED"
        );

        User interviewee = userRepository.findById(request.getIntervieweeId()).orElse(null);
        if (interviewee != null) {
            activityLogService.log(interviewee, ActivityAction.INTERVIEW_SCHEDULED,
                    String.format("%s scheduled by %s | Type: %s | %s",
                            modeLabel, interviewerName, request.getType(), scheduleTimeLabel));
        }

        User interviewer = userRepository.findByEmail(interviewerName);
        if (interviewer != null) {
            try {
                badgeService.checkAndAwardBadges(interviewer.getId());
            } catch (Exception e) {
                log.warn("Failed to check badges for interviewer {}: {}", interviewerName, e.getMessage());
            }
        }
        ScheduledInterviewDto dto = toDto(entity);
        realtimeEventService.publishInterviewEvent(
                "INTERVIEW_SCHEDULED",
                entity.getId(),
                entity.getIntervieweeId(),
                entity.getApplicationId(),
                dto
        );
        return dto;
    }

    private ScheduledInterviewDto toDto(ScheduledInterview entity) {
        boolean completed = isCompleted(entity);
        return toDto(entity, completed);
    }

    private boolean isCompleted(ScheduledInterview entity) {
        if (entity.getInterviewMode() == InterviewMode.ZOOM) {
            return Boolean.TRUE.equals(entity.getLiveCompleted());
        }
        return sessionRepository.existsByScheduledInterviewIdAndStatus(entity.getId(), SessionStatus.COMPLETED);
    }

    @Override
    public List<ScheduledInterviewDto> getForUser(Long userId) {
        List<ScheduledInterview> list = repository.findByIntervieweeId(userId);
        log.info("Found {} scheduled interviews for user {}", list.size(), userId);
        List<ScheduledInterviewDto> result = new ArrayList<>();
        for (ScheduledInterview entity : list) {
            try {
                ScheduledInterviewDto dto = toDto(entity);
                dto.setMeetingStartUrl(null);
                result.add(dto);
            } catch (Exception e) {
                log.error("Failed to convert scheduled interview {}: {}", entity.getId(), e.getMessage(), e);
            }
        }
        sortScheduledInterviews(result);
        return result;
    }

    @Override
    public List<ScheduledInterviewDto> getByInterviewer(String interviewerName) {
        List<ScheduledInterview> list = repository.findByScheduledByInterviewer(interviewerName);
        log.info("Found {} scheduled interviews for interviewer {}", list.size(), interviewerName);
        List<ScheduledInterviewDto> result = list.stream().map(this::toDto).collect(Collectors.toList());
        sortScheduledInterviews(result);
        return result;
    }

    private void sortScheduledInterviews(List<ScheduledInterviewDto> list) {
        LocalDateTime now = LocalDateTime.now();
        list.sort((a, b) -> {
            int groupA = getPriorityGroup(a, now);
            int groupB = getPriorityGroup(b, now);
            if (groupA != groupB) {
                return Integer.compare(groupA, groupB);
            }
            LocalDateTime dateA = getEffectiveDate(a);
            LocalDateTime dateB = getEffectiveDate(b);
            if (dateA != null && dateB != null) {
                int cmp = dateB.compareTo(dateA);
                if (cmp != 0) {
                    return cmp;
                }
            } else if (dateA != null) {
                return -1;
            } else if (dateB != null) {
                return 1;
            }
            return Long.compare(b.getId() != null ? b.getId() : 0L, a.getId() != null ? a.getId() : 0L);
        });
    }

    private int getPriorityGroup(ScheduledInterviewDto dto, LocalDateTime now) {
        boolean completed = Boolean.TRUE.equals(dto.getCompleted());
        if (completed) {
            return 1;
        }
        LocalDateTime effective = getEffectiveDate(dto);
        boolean expired = effective != null && effective.isBefore(now) && !Boolean.TRUE.equals(dto.getCallEnded());
        if (!expired) {
            return 0;
        }
        return 2;
    }

    private LocalDateTime getEffectiveDate(ScheduledInterviewDto dto) {
        if (dto.getInterviewMode() == InterviewMode.ZOOM && dto.getScheduledAt() != null) {
            return dto.getScheduledAt();
        }
        if (dto.getDueDate() != null) {
            return dto.getDueDate();
        }
        return dto.getCreatedAt();
    }

    @Override
    public ScheduledInterviewDto getByApplicationId(Long applicationId) {
        List<ScheduledInterview> list = repository.findByApplicationIdOrderByCreatedAtDesc(applicationId);
        if (list.isEmpty()) {
            throw new RuntimeException("No scheduled interview found for application " + applicationId);
        }
        return toDto(list.get(0));
    }

    @Override
    public ScheduledInterviewDto getById(Long id) {
        ScheduledInterview entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Scheduled interview not found"));
        boolean completed = isCompleted(entity);
        return toDto(entity, completed);
    }

    @Override
    public ScheduledInterviewDto getByStageId(Long stageId) {
        ScheduledInterview entity = repository.findByApplicationStageId(stageId)
                .orElseThrow(() -> new RuntimeException("Scheduled interview not found for stage"));
        return toDto(entity);
    }

    @Override
    @Transactional
    public ScheduledInterviewDto endLiveCall(Long id) {
        ScheduledInterview entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Scheduled interview not found"));
        entity.setCallEnded(true);
        entity = repository.save(entity);
        log.info("Live interview call ended for scheduledInterviewId={}", id);
        ScheduledInterviewDto dto = toDto(entity);
        realtimeEventService.publishInterviewEvent(
                "INTERVIEW_CALL_ENDED",
                entity.getId(),
                entity.getIntervieweeId(),
                entity.getApplicationId(),
                dto
        );
        return dto;
    }

    @Override
    @Transactional
    public ScheduledInterviewDto evaluateLiveInterview(Long id, StageDecisionRequest decision) {
        ScheduledInterview entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Scheduled interview not found"));

        entity.setCallEnded(true);
        entity.setLiveCompleted(true);
        entity = repository.save(entity);

        Long stageId = entity.getApplicationStageId() != null ? entity.getApplicationStageId() : entity.getStageId();
        Double score = decision != null && decision.getScore() != null ? decision.getScore() : 70.0;
        boolean approved = decision == null || decision.getApproved() == null
                ? score >= (entity.getMinimumScore() != null ? entity.getMinimumScore() : 70.0)
                : Boolean.TRUE.equals(decision.getApproved());

        if (stageId != null && entity.getApplicationId() != null) {
            if (approved) {
                stageWorkflowService.approveStage(entity.getApplicationId(), stageId, score, decision);
            } else {
                stageWorkflowService.rejectStage(entity.getApplicationId(), stageId, decision);
            }
        } else {
            double commScore = decision != null && decision.getCommunicationScore() != null
                    ? decision.getCommunicationScore()
                    : score;
            double techScore = decision != null && decision.getTechnicalScore() != null
                    ? decision.getTechnicalScore()
                    : score;
            double confScore = decision != null && decision.getConfidenceScore() != null
                    ? decision.getConfidenceScore()
                    : score;

            final ScheduledInterview finalEntity = entity;
            InterviewSession session = sessionRepository.findByScheduledInterviewId(id)
                    .orElseGet(() -> InterviewSession.builder()
                            .userId(finalEntity.getIntervieweeId())
                            .type(finalEntity.getType())
                            .difficulty(finalEntity.getDifficulty())
                            .duration(finalEntity.getDuration())
                            .questionCount(0)
                            .avatarStyle(finalEntity.getAvatarStyle())
                            .isScheduled(true)
                            .scheduledInterviewId(finalEntity.getId())
                            .startedAt(finalEntity.getScheduledAt() != null
                                    ? finalEntity.getScheduledAt()
                                    : LocalDateTime.now())
                            .originalQuestionCount(0)
                            .originalDurationMinutes(
                                    finalEntity.getDuration() != null ? finalEntity.getDuration() : 30)
                            .build());
            session.setStatus(SessionStatus.COMPLETED);
            session.setOverallScore(score);
            session.setCommunicationScore(commScore);
            session.setTechnicalScore(techScore);
            session.setConfidenceScore(confScore);
            session.setCompletedAt(LocalDateTime.now());
            session = sessionRepository.save(session);

            final Long sessionId = session.getId();
            InterviewFeedback fb = feedbackRepository.findBySessionId(sessionId)
                    .orElseGet(() -> InterviewFeedback.builder()
                            .sessionId(sessionId)
                            .suggestedResources("[]")
                            .build());
            fb.setOverallScore(score);
            fb.setStrengths(decision != null && decision.getStrengths() != null
                    ? decision.getStrengths()
                    : "Demonstrated strong engagement during the live interview.");
            fb.setImprovements(decision != null && decision.getImprovements() != null
                    ? decision.getImprovements()
                    : "Continue building structured examples.");
            fb.setDetailedFeedback(decision != null && decision.getFeedback() != null
                    ? decision.getFeedback()
                    : "Evaluated by interviewer following the live video session.");
            if (fb.getSuggestedResources() == null) {
                fb.setSuggestedResources("[]");
            }
            feedbackRepository.save(fb);
        }

        ScheduledInterviewDto dto = toDto(entity, true);
        realtimeEventService.publishInterviewEvent(
                "INTERVIEW_EVALUATED",
                entity.getId(),
                entity.getIntervieweeId(),
                entity.getApplicationId(),
                dto
        );
        return dto;
    }

    private ScheduledInterviewDto toDto(ScheduledInterview entity, boolean completed) {
        String interviewerDisplayName = entity.getScheduledByInterviewer();
        if (entity.getScheduledByInterviewer() != null) {
            User interviewerUser = userRepository.findByEmail(entity.getScheduledByInterviewer());
            if (interviewerUser != null) {
                interviewerDisplayName = interviewerUser.getFullName() != null
                        && !interviewerUser.getFullName().isBlank()
                        ? interviewerUser.getFullName()
                        : interviewerUser.getUserName();
            }
        }

        String intervieweeEmail = null;
        if (entity.getIntervieweeId() != null) {
            User intervieweeUser = userRepository.findById(entity.getIntervieweeId()).orElse(null);
            if (intervieweeUser != null) {
                intervieweeEmail = intervieweeUser.getEmail();
            }
        }

        return ScheduledInterviewDto.builder()
                .id(entity.getId())
                .intervieweeId(entity.getIntervieweeId())
                .intervieweeName(entity.getIntervieweeName())
                .intervieweeEmail(intervieweeEmail)
                .type(entity.getType())
                .interviewMode(entity.getInterviewMode() != null ? entity.getInterviewMode() : InterviewMode.AI)
                .difficulty(entity.getDifficulty())
                .duration(entity.getDuration())
                .questionCount(entity.getQuestionCount())
                .avatarStyle(entity.getAvatarStyle())
                .scheduledByInterviewer(entity.getScheduledByInterviewer())
                .interviewerName(interviewerDisplayName)
                .dueDate(entity.getDueDate())
                .scheduledAt(entity.getScheduledAt())
                .meetingId(entity.getMeetingId())
                .meetingJoinUrl(entity.getMeetingJoinUrl())
                .meetingStartUrl(entity.getMeetingStartUrl())
                .meetingPasscode(entity.getMeetingPasscode())
                .callEnded(Boolean.TRUE.equals(entity.getCallEnded()))
                .createdAt(entity.getCreatedAt())
                .applicationId(entity.getApplicationId())
                .minimumScore(entity.getMinimumScore())
                .completed(completed)
                .stageId(entity.getStageId())
                .applicationStageId(entity.getApplicationStageId())
                .build();
    }
}