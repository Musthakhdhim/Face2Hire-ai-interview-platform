package com.aiinterview.face2hire_backend.dto.interview;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class FeedbackResponseDto {
    private Long questionId;
    private Double score;
    private String feedbackText;
    private String strengths;
    private String improvements;
    private String suggestedAnswer;
    private List<String> keywordsMatched;
    private List<String> keywordsMissing;
    private List<String> grammarIssues;
}