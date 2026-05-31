package com.aiinterview.face2hire_backend.serviceimpl.interview;

import com.aiinterview.face2hire_backend.dto.interview.ScheduleInterviewRequest;
import com.aiinterview.face2hire_backend.dto.interview.ScheduledInterviewDto;
import com.aiinterview.face2hire_backend.entity.interview.ScheduledInterview;
import com.aiinterview.face2hire_backend.repository.interview.ScheduledInterviewRepository;
import com.aiinterview.face2hire_backend.service.interview.ScheduledInterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduledInterviewServiceImpl implements ScheduledInterviewService {

    private final ScheduledInterviewRepository repository;

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
                .build();
        entity = repository.save(entity);
        return toDto(entity);
    }

    @Override
    public List<ScheduledInterviewDto> getForUser(Long userId) {
        return repository.findByIntervieweeId(userId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<ScheduledInterviewDto> getByInterviewer(String interviewerName) {
        return repository.findByScheduledByInterviewer(interviewerName).stream().map(this::toDto).collect(Collectors.toList());
    }

    private ScheduledInterviewDto toDto(ScheduledInterview entity) {
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
                .build();
    }
}
