package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.ActivityAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogFilterRequest {
    private String search;
    private ActivityAction action;
    private Integer page;
    private Integer size;
}