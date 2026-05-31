package com.aiinterview.face2hire_backend.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponseDto {
    private Double score;
    private String feedbackText;
    private String strengths;      // String, not List
    private String improvements;   // String, not List
    private String suggestedAnswer;
    private List<String> keywordsMatched;
    private List<String> keywordsMissing;
    private List<String> grammarIssues;
}