package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.BadgeDto;
import com.aiinterview.face2hire_backend.entity.*;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import com.aiinterview.face2hire_backend.repository.*;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.service.BadgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BadgeServiceImpl implements BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BadgeDto> getAllBadges() {
        return badgeRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BadgeDto> getBadgesByType(String type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        BadgeType badgeType = type != null ? BadgeType.valueOf(type.toUpperCase()) : null;
        Page<Badge> badgePage = (badgeType != null) ? badgeRepository.findByType(badgeType, pageable) : badgeRepository.findAll(pageable);
        return badgePage.map(this::toDto);
    }

    @Override
    @Transactional
    public BadgeDto createBadge(BadgeDto dto) {
        if (badgeRepository.findByName(dto.getName()).isPresent()) {
            throw new RuntimeException("Badge with name " + dto.getName() + " already exists");
        }
        Badge badge = Badge.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .iconUrl(dto.getIconUrl())
                .type(dto.getType())
                .requirement(dto.getRequirement())
                .build();
        badge = badgeRepository.save(badge);
        log.info("Created badge: {}", badge.getName());
        return toDto(badge);
    }

    @Override
    @Transactional
    public BadgeDto updateBadge(Long id, BadgeDto dto) {
        Badge badge = badgeRepository.findById(id).orElseThrow(() -> new RuntimeException("Badge not found"));
        badge.setName(dto.getName());
        badge.setDescription(dto.getDescription());
        badge.setIconUrl(dto.getIconUrl());
        badge.setType(dto.getType());
        badge.setRequirement(dto.getRequirement());
        badge = badgeRepository.save(badge);
        log.info("Updated badge: {}", badge.getName());
        return toDto(badge);
    }

    @Override
    @Transactional
    public void deleteBadge(Long id) {
        badgeRepository.deleteById(id);
        log.info("Deleted badge with id: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BadgeDto> getUserBadges(Long userId) {
        return userBadgeRepository.findByUserId(userId).stream()
                .map(ub -> toDto(ub.getBadge()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void awardBadgeToUser(Long userId, Long badgeId) {
        if (userBadgeRepository.existsByUserIdAndBadgeId(userId, badgeId)) {
            throw new RuntimeException("User already has this badge");
        }
        Badge badge = badgeRepository.findById(badgeId).orElseThrow(() -> new RuntimeException("Badge not found"));
        UserBadge userBadge = UserBadge.builder()
                .userId(userId)
                .badge(badge)
                .build();
        userBadgeRepository.save(userBadge);
        log.info("Awarded badge '{}' to user {}", badge.getName(), userId);
    }

    private BadgeDto toDto(Badge badge) {
        return BadgeDto.builder()
                .id(badge.getId())
                .name(badge.getName())
                .description(badge.getDescription())
                .iconUrl(badge.getIconUrl())
                .type(badge.getType())
                .requirement(badge.getRequirement())
                .createdAt(badge.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void checkAndAwardBadges(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        long completedInterviews = interviewSessionRepository.countByUserIdAndStatus(userId, SessionStatus.COMPLETED);
        double avgScore = interviewSessionRepository.getAverageOverallScoreByUserId(userId); // new method needed
        long jobsPosted = jobRepository.countByPostedByUserId(userId);
        long hiredCount = applicationRepository.countApprovedByInterviewerId(userId); // for interviewer badge

        List<Badge> badges = badgeRepository.findAll();
        for (Badge badge : badges) {
            if (badge.getType() == BadgeType.GENERAL ||
                    (user.getRole() == Role.INTERVIEWEE && badge.getType() == BadgeType.INTERVIEWEE) ||
                    (user.getRole() == Role.INTERVIEWER && badge.getType() == BadgeType.INTERVIEWER)) {

                if (userBadgeRepository.existsByUserIdAndBadgeId(userId, badge.getId())) continue;

                if (evaluateRequirement(badge.getRequirement(), completedInterviews, avgScore, jobsPosted, hiredCount)) {
                    awardBadgeToUser(userId, badge.getId());
                }
            }
        }
    }

    private boolean evaluateRequirement(String requirement, long completedInterviews, double avgScore, long jobsPosted, long hiredCount) {
        if (requirement == null || requirement.isBlank()) return false;

        if (requirement.contains("completed_interviews")) {
            Pattern pattern = Pattern.compile("completed_interviews\\s*(>=|>|<=|<|=)\\s*(\\d+)");
            Matcher matcher = pattern.matcher(requirement);
            if (matcher.find()) {
                String op = matcher.group(1);
                int threshold = Integer.parseInt(matcher.group(2));
                switch (op) {
                    case ">=": return completedInterviews >= threshold;
                    case ">": return completedInterviews > threshold;
                    case "<=": return completedInterviews <= threshold;
                    case "<": return completedInterviews < threshold;
                    case "=": return completedInterviews == threshold;
                }
            }
        } else if (requirement.contains("avg_score")) {
            Pattern pattern = Pattern.compile("avg_score\\s*(>=|>|<=|<|=)\\s*(\\d+)");
            Matcher matcher = pattern.matcher(requirement);
            if (matcher.find()) {
                String op = matcher.group(1);
                int threshold = Integer.parseInt(matcher.group(2));
                switch (op) {
                    case ">=": return avgScore >= threshold;
                    case ">": return avgScore > threshold;
                    case "<=": return avgScore <= threshold;
                    case "<": return avgScore < threshold;
                    case "=": return avgScore == threshold;
                }
            }
        } else if (requirement.contains("jobs_posted")) {
            Pattern pattern = Pattern.compile("jobs_posted\\s*(>=|>|<=|<|=)\\s*(\\d+)");
            Matcher matcher = pattern.matcher(requirement);
            if (matcher.find()) {
                String op = matcher.group(1);
                int threshold = Integer.parseInt(matcher.group(2));
                switch (op) {
                    case ">=": return jobsPosted >= threshold;
                    case ">": return jobsPosted > threshold;
                    case "<=": return jobsPosted <= threshold;
                    case "<": return jobsPosted < threshold;
                    case "=": return jobsPosted == threshold;
                }
            }
        } else if (requirement.contains("hired_count")) {
            Pattern pattern = Pattern.compile("hired_count\\s*(>=|>|<=|<|=)\\s*(\\d+)");
            Matcher matcher = pattern.matcher(requirement);
            if (matcher.find()) {
                String op = matcher.group(1);
                int threshold = Integer.parseInt(matcher.group(2));
                switch (op) {
                    case ">=": return hiredCount >= threshold;
                    case ">": return hiredCount > threshold;
                    case "<=": return hiredCount <= threshold;
                    case "<": return hiredCount < threshold;
                    case "=": return hiredCount == threshold;
                }
            }
        }
        return false;
    }
}