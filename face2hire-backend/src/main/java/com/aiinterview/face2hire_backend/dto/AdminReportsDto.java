package com.aiinterview.face2hire_backend.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportsDto {
    private UserReport userReport;
    private InterviewReport interviewReport;
    private JobReport jobReport;
    private ApplicationReport applicationReport;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserReport {
        private long totalUsers;
        private long activeUsers;
        private long verifiedUsers;
        private Map<String, Long> usersByRole;
        private List<UserGrowthPoint> userGrowth;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserGrowthPoint {
        private String month;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewReport {
        private long totalInterviews;
        private long completedInterviews;
        private long abandonedInterviews;
        private long activeInterviews;
        private Map<String, Long> interviewsByType;
        private Map<String, Double> averageScoreByType;
        private List<InterviewVolumePoint> interviewVolume;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewVolumePoint {
        private String date;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobReport {
        private long totalJobs;
        private long activeJobs;
        private long closedJobs;
        private Map<String, Long> jobsByType;
        private List<JobPostingPoint> jobPostings;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobPostingPoint {
        private String month;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationReport {
        private long totalApplications;
        private long pendingApplications;
        private long approvedApplications;
        private long rejectedApplications;
        private Map<String, Long> applicationsByStatus;
    }
}