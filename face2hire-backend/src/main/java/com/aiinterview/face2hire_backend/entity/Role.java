package com.aiinterview.face2hire_backend.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Set;

@AllArgsConstructor
public enum Role {
    INTERVIEWER(
            Set.of()
    ),
    INTERVIEWEE(
            Set.of()
    ),
    ADMIN(
            Set.of()
    );

    @Getter
    private Set<Permissions> permissions;
}
