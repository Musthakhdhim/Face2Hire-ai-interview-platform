package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.AdminJobDetailResponseDto;
import com.aiinterview.face2hire_backend.dto.AdminJobFilterRequest;
import com.aiinterview.face2hire_backend.dto.AdminJobResponseDto;
import com.aiinterview.face2hire_backend.entity.Application;
import com.aiinterview.face2hire_backend.entity.Job;
import com.aiinterview.face2hire_backend.entity.JobSkill;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.repository.ApplicationRepository;
import com.aiinterview.face2hire_backend.repository.JobRepository;
import com.aiinterview.face2hire_backend.repository.JobSkillRepository;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.repository.interview.ScheduledInterviewRepository;
import com.aiinterview.face2hire_backend.service.AdminJobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminJobServiceImpl implements AdminJobService {

    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final ScheduledInterviewRepository scheduledInterviewRepository;


    @Override
    @Transactional(readOnly = true)
    public Page<AdminJobResponseDto> getAllJobs(AdminJobFilterRequest filter) {
        log.info("Admin fetching jobs with filters: {}", filter);

        int page = filter.getPage() != null ? filter.getPage() : 0;
        int size = filter.getSize() != null ? filter.getSize() : 20;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        LocalDateTime fromDateTime = filter.getFromDate() != null
                ? filter.getFromDate().atStartOfDay()
                : null;
        LocalDateTime toDateTime = filter.getToDate() != null
                ? filter.getToDate().atTime(LocalTime.MAX)
                : null;

        Page<Job> jobs = jobRepository.findAllWithFilters(
                filter.getSearch(),
                filter.getType(),
                filter.getStatus(),
                filter.getPostedByUserId(),
                fromDateTime,
                toDateTime,
                pageable
        );

        return jobs.map(this::convertToDto);
    }

    private AdminJobResponseDto convertToDto(Job job) {
        String userName = null;
        String userEmail = null;
        Optional<User> userOpt = userRepository.findById(job.getPostedByUserId());
        if (userOpt.isPresent()) {
            userName = userOpt.get().getFullName() != null ? userOpt.get().getFullName() : userOpt.get().getUserName();
            userEmail = userOpt.get().getEmail();
        }

        // Fetch skills for this job
        java.util.List<String> skills = jobSkillRepository.findByJobId(job.getId())
                .stream()
                .map(js -> js.getSkillName())
                .collect(Collectors.toList());

        return AdminJobResponseDto.builder()
                .id(job.getId())
                .title(job.getTitle())
                .company(job.getCompany())
                .location(job.getLocation())
                .type(job.getType())
                .salary(job.getSalary())
                .requiredExperience(job.getRequiredExperience())
                .description(job.getDescription())
                .postedByUserId(job.getPostedByUserId())
                .postedByUserName(userName)
                .postedByUserEmail(userEmail)
                .applicantsCount(job.getApplicantsCount())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .skills(skills)
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public AdminJobDetailResponseDto getJobDetail(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        // Get poster info
        String userName = null;
        String userEmail = null;
        Optional<User> userOpt = userRepository.findById(job.getPostedByUserId());
        if (userOpt.isPresent()) {
            userName = userOpt.get().getFullName() != null ? userOpt.get().getFullName() : userOpt.get().getUserName();
            userEmail = userOpt.get().getEmail();
        }

        // Get skills
        List<String> skills = jobSkillRepository.findByJobId(job.getId())
                .stream().map(JobSkill::getSkillName).collect(Collectors.toList());

        // Get applications for this job
        List<Application> applications = applicationRepository.findByJobId(jobId);
        List<AdminJobDetailResponseDto.ApplicationSummary> appSummaries = applications.stream()
                .map(app -> {
                    // Get user info
                    String appUserName = null;
                    String appUserEmail = null;
                    Optional<User> appUser = userRepository.findById(app.getUserId());
                    if (appUser.isPresent()) {
                        appUserName = appUser.get().getFullName() != null ? appUser.get().getFullName() : appUser.get().getUserName();
                        appUserEmail = appUser.get().getEmail();
                    }
                    boolean hasScheduled = scheduledInterviewRepository.existsByApplicationId(app.getId());
                    return AdminJobDetailResponseDto.ApplicationSummary.builder()
                            .id(app.getId())
                            .userId(app.getUserId())
                            .userName(appUserName)
                            .userEmail(appUserEmail)
                            .status(app.getStatus().name())
                            .score(app.getScore())
                            .appliedAt(app.getAppliedAt())
                            .hasScheduledInterview(hasScheduled)
                            .build();
                })
                .collect(Collectors.toList());

        return AdminJobDetailResponseDto.builder()
                .id(job.getId())
                .title(job.getTitle())
                .company(job.getCompany())
                .location(job.getLocation())
                .type(job.getType())
                .salary(job.getSalary())
                .requiredExperience(job.getRequiredExperience())
                .description(job.getDescription())
                .postedByUserId(job.getPostedByUserId())
                .postedByUserName(userName)
                .postedByUserEmail(userEmail)
                .applicantsCount(job.getApplicantsCount())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .skills(skills)
                .applications(appSummaries)
                .build();
    }
}