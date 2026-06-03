package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import com.aiinterview.face2hire_backend.entity.interview.Difficulty;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminInterviewFilterRequest {
    private String search;
    private InterviewType type;
    private SessionStatus status;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Integer page;
    private Integer size;
}