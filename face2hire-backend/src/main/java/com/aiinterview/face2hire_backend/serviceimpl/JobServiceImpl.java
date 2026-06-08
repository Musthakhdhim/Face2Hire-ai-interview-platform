package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.JobListResponseDto;
import com.aiinterview.face2hire_backend.dto.JobRequestDto;
import com.aiinterview.face2hire_backend.dto.JobResponseDto;
import com.aiinterview.face2hire_backend.entity.*;

import com.aiinterview.face2hire_backend.exception.ResourceNotFoundException;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.repository.JobRepository;
import com.aiinterview.face2hire_backend.repository.JobSkillRepository;
import com.aiinterview.face2hire_backend.service.BadgeService;
import com.aiinterview.face2hire_backend.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService {

    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final BadgeService badgeService;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @jakarta.annotation.PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
    }

    @Override
    @Transactional
    public JobResponseDto createJob(Long userId, JobRequestDto request) {
        log.info("Creating job for user {}: {}", userId, request.getTitle());

        Job job = Job.builder()
                .title(request.getTitle())
                .company(request.getCompany())
                .location(request.getLocation())
                .type(request.getType())
                .salary(request.getSalary())
                .requiredExperience(request.getRequiredExperience())
                .description(request.getDescription())
                .postedByUserId(userId)
                .status(JobStatus.ACTIVE)
                .build();

        job = jobRepository.save(job);

        // Save skills
        if (request.getSkills() != null && !request.getSkills().isEmpty()) {
            Job finalJob = job;
            List<JobSkill> skills = request.getSkills().stream()
                    .map(skill -> JobSkill.builder()
                            .jobId(finalJob.getId())
                            .skillName(skill.trim())
                            .build())
                    .collect(Collectors.toList());
            jobSkillRepository.saveAll(skills);
        }

        badgeService.checkAndAwardBadges(userId);

        log.info("Job created with id: {}", job.getId());
        return mapToResponseDto(job);
    }

    @Override
    @Transactional(readOnly = true)
    public JobResponseDto getJobById(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + jobId));
        return mapToResponseDto(job);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobListResponseDto> getJobsByInterviewer(Long userId, Pageable pageable) {
        Page<Job> jobs = jobRepository.findByPostedByUserId(userId, pageable);
        return jobs.map(this::mapToListResponseDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<JobListResponseDto> getAllActiveJobs(String keyword, Pageable pageable) {
        Page<Job> jobs;
        if (keyword != null && !keyword.isBlank()) {
            jobs = jobRepository.searchActiveJobs(keyword, pageable);
        } else {
            jobs = jobRepository.findByStatus(JobStatus.ACTIVE, pageable);
        }
        return jobs.map(this::mapToListResponseDto);
    }

    @Override
    @Transactional
    public JobResponseDto updateJob(Long jobId, Long userId, JobRequestDto request) throws AccessDeniedException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!job.getPostedByUserId().equals(userId)) {
            throw new AccessDeniedException("You are not the owner of this job");
        }

        job.setTitle(request.getTitle());
        job.setCompany(request.getCompany());
        job.setLocation(request.getLocation());
        job.setType(request.getType());
        job.setSalary(request.getSalary());
        job.setRequiredExperience(request.getRequiredExperience());
        job.setDescription(request.getDescription());
        job = jobRepository.save(job);

        jobSkillRepository.deleteByJobId(jobId);
        if (request.getSkills() != null && !request.getSkills().isEmpty()) {
            Job finalJob = job;
            List<JobSkill> skills = request.getSkills().stream()
                    .map(skill -> JobSkill.builder()
                            .jobId(finalJob.getId())
                            .skillName(skill.trim())
                            .build())
                    .collect(Collectors.toList());
            jobSkillRepository.saveAll(skills);
        }

        log.info("Job updated: {}", jobId);
        return mapToResponseDto(job);
    }

    @Override
    @Transactional
    public void deleteJob(Long jobId, Long userId) throws AccessDeniedException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!job.getPostedByUserId().equals(userId)) {
            throw new AccessDeniedException("You are not the owner of this job");
        }
        jobSkillRepository.deleteByJobId(jobId);
        jobRepository.delete(job);
        log.info("Job deleted: {}", jobId);
    }

    @Override
    @Transactional
    public JobResponseDto closeJob(Long jobId, Long userId) throws AccessDeniedException {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!job.getPostedByUserId().equals(userId)) {
            throw new AccessDeniedException("You are not the owner of this job");
        }
        job.setStatus(JobStatus.CLOSED);
        job = jobRepository.save(job);
        log.info("Job closed: {}", jobId);
        return mapToResponseDto(job);
    }

    private JobResponseDto mapToResponseDto(Job job) {
        List<String> skills = jobSkillRepository.findByJobId(job.getId())
                .stream().map(JobSkill::getSkillName).collect(Collectors.toList());

        return JobResponseDto.builder()
                .id(job.getId())
                .title(job.getTitle())
                .company(job.getCompany())
                .location(job.getLocation())
                .type(job.getType())
                .salary(job.getSalary())
                .matchPercentage(job.getMatchPercentage())
                .requiredExperience(job.getRequiredExperience())
                .description(job.getDescription())
                .postedByUserId(job.getPostedByUserId())
                .applicantsCount(job.getApplicantsCount())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .skills(skills)
                .build();
    }

    private JobListResponseDto mapToListResponseDto(Job job) {
        List<String> skills = jobSkillRepository.findByJobId(job.getId())
                .stream().map(JobSkill::getSkillName).collect(Collectors.toList());

        return JobListResponseDto.builder()
                .id(job.getId())
                .title(job.getTitle())
                .company(job.getCompany())
                .location(job.getLocation())
                .type(job.getType())
                .salary(job.getSalary())
                .requiredExperience(job.getRequiredExperience())
                .applicantsCount(job.getApplicantsCount())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .skills(skills)
                .matchPercentage(job.getMatchPercentage())
                .build();
    }
}