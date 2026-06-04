package com.aiinterview.face2hire_backend.serviceimpl;


import com.aiinterview.face2hire_backend.dto.AdminReportsDto;
import com.aiinterview.face2hire_backend.entity.*;
import com.aiinterview.face2hire_backend.entity.interview.InterviewSession;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import com.aiinterview.face2hire_backend.repository.*;
import com.aiinterview.face2hire_backend.repository.interview.InterviewSessionRepository;
import com.aiinterview.face2hire_backend.service.AdminReportsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminReportsServiceImpl implements AdminReportsService {

    private final UserRepository userRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminReportsDto getReports(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(23, 59, 59) : null;

        return AdminReportsDto.builder()
                .userReport(getUserReport(startDateTime, endDateTime))
                .interviewReport(getInterviewReport(startDateTime, endDateTime))
                .jobReport(getJobReport(startDateTime, endDateTime))
                .applicationReport(getApplicationReport(startDateTime, endDateTime))
                .build();
    }

    private AdminReportsDto.UserReport getUserReport(LocalDateTime start, LocalDateTime end) {
        List<User> users = getFilteredUsers(start, end);
        long total = users.size();
        long active = users.stream().filter(User::isActive).count();
        long verified = users.stream().filter(User::isVerified).count();

        Map<String, Long> usersByRole = users.stream()
                .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));

        // User growth (last 12 months)
        List<AdminReportsDto.UserGrowthPoint> userGrowth = new ArrayList<>();
        List<Object[]> growthRaw = userRepository.countUsersByMonth();
        for (Object[] row : growthRaw) {
            userGrowth.add(AdminReportsDto.UserGrowthPoint.builder()
                    .month((String) row[0])
                    .count(((Number) row[1]).longValue())
                    .build());
        }

        return AdminReportsDto.UserReport.builder()
                .totalUsers(total)
                .activeUsers(active)
                .verifiedUsers(verified)
                .usersByRole(usersByRole)
                .userGrowth(userGrowth)
                .build();
    }

    private AdminReportsDto.InterviewReport getInterviewReport(LocalDateTime start, LocalDateTime end) {
        List<InterviewSession> sessions = getFilteredSessions(start, end);
        long total = sessions.size();
        long completed = sessions.stream().filter(s -> s.getStatus() == SessionStatus.COMPLETED).count();
        long abandoned = sessions.stream().filter(s -> s.getStatus() == SessionStatus.ABANDONED).count();
        long active = sessions.stream().filter(s -> s.getStatus() == SessionStatus.ACTIVE).count();

        Map<String, Long> interviewsByType = sessions.stream()
                .collect(Collectors.groupingBy(s -> s.getType().name(), Collectors.counting()));

        Map<String, Double> averageScoreByType = new HashMap<>();
        for (InterviewSession session : sessions) {
            if (session.getOverallScore() != null && session.getStatus() == SessionStatus.COMPLETED) {
                String type = session.getType().name();
                averageScoreByType.merge(type, session.getOverallScore(), (old, val) -> (old + val) / 2);
            }
        }

        // Interview volume by date (last 30 days)
        List<AdminReportsDto.InterviewVolumePoint> interviewVolume = new ArrayList<>();
        Map<LocalDate, Long> volumeByDate = sessions.stream()
                .filter(s -> s.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getCreatedAt().toLocalDate(),
                        Collectors.counting()
                ));
        // Sort by date and take last 30
        volumeByDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> interviewVolume.add(
                        AdminReportsDto.InterviewVolumePoint.builder()
                                .date(entry.getKey().toString())
                                .count(entry.getValue())
                                .build()));

        return AdminReportsDto.InterviewReport.builder()
                .totalInterviews(total)
                .completedInterviews(completed)
                .abandonedInterviews(abandoned)
                .activeInterviews(active)
                .interviewsByType(interviewsByType)
                .averageScoreByType(averageScoreByType)
                .interviewVolume(interviewVolume)
                .build();
    }

    private AdminReportsDto.JobReport getJobReport(LocalDateTime start, LocalDateTime end) {
        List<Job> jobs = getFilteredJobs(start, end);
        long total = jobs.size();
        long active = jobs.stream().filter(j -> j.getStatus() == JobStatus.ACTIVE).count();
        long closed = jobs.stream().filter(j -> j.getStatus() == JobStatus.CLOSED).count();

        Map<String, Long> jobsByType = jobs.stream()
                .collect(Collectors.groupingBy(j -> j.getType().name(), Collectors.counting()));

        // Job postings by month
        List<AdminReportsDto.JobPostingPoint> jobPostings = new ArrayList<>();
        Map<String, Long> postingsByMonth = jobs.stream()
                .collect(Collectors.groupingBy(
                        j -> j.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()
                ));
        postingsByMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> jobPostings.add(
                        AdminReportsDto.JobPostingPoint.builder()
                                .month(entry.getKey())
                                .count(entry.getValue())
                                .build()));

        return AdminReportsDto.JobReport.builder()
                .totalJobs(total)
                .activeJobs(active)
                .closedJobs(closed)
                .jobsByType(jobsByType)
                .jobPostings(jobPostings)
                .build();
    }

    private AdminReportsDto.ApplicationReport getApplicationReport(LocalDateTime start, LocalDateTime end) {
        List<Application> applications = getFilteredApplications(start, end);
        long total = applications.size();
        long pending = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).count();
        long approved = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED).count();
        long rejected = applications.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();

        Map<String, Long> applicationsByStatus = applications.stream()
                .collect(Collectors.groupingBy(a -> a.getStatus().name(), Collectors.counting()));

        return AdminReportsDto.ApplicationReport.builder()
                .totalApplications(total)
                .pendingApplications(pending)
                .approvedApplications(approved)
                .rejectedApplications(rejected)
                .applicationsByStatus(applicationsByStatus)
                .build();
    }

    private List<User> getFilteredUsers(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) return userRepository.findAll();
        return userRepository.findAll().stream()
                .filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().isBefore(start) && !u.getCreatedAt().isAfter(end))
                .collect(Collectors.toList());
    }

    private List<InterviewSession> getFilteredSessions(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) return interviewSessionRepository.findAll();
        return interviewSessionRepository.findAll().stream()
                .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(start) && !s.getCreatedAt().isAfter(end))
                .collect(Collectors.toList());
    }

    private List<Job> getFilteredJobs(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) return jobRepository.findAll();
        return jobRepository.findAll().stream()
                .filter(j -> j.getCreatedAt() != null && !j.getCreatedAt().isBefore(start) && !j.getCreatedAt().isAfter(end))
                .collect(Collectors.toList());
    }

    private List<Application> getFilteredApplications(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) return applicationRepository.findAll();
        return applicationRepository.findAll().stream()
                .filter(a -> a.getAppliedAt() != null && !a.getAppliedAt().isBefore(start) && !a.getAppliedAt().isAfter(end))
                .collect(Collectors.toList());
    }
}