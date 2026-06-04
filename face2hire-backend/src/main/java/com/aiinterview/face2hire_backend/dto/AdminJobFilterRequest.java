package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.JobStatus;
import com.aiinterview.face2hire_backend.entity.JobType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminJobFilterRequest {
    private String search;
    private JobType type;
    private JobStatus status;
    private Long postedByUserId;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Integer page;
    private Integer size;
}
