package com.aiinterview.face2hire_backend.dto.interview;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class QuestionResponseDto {
    private Long questionId;
    private Integer questionIndex;
    private String questionText;
    private String category;
    private List<String> expectedKeywords;
}