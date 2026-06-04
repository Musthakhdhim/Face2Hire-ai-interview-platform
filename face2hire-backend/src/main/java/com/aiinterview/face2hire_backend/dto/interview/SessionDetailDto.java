package com.aiinterview.face2hire_backend.dto.interview;

import com.aiinterview.face2hire_backend.entity.interview.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionDetailDto {
    private Long id;
    private InterviewType type;
    private Difficulty difficulty;
    private Integer duration;
    private Integer questionCount;
    private AvatarStyle avatarStyle;
    private SessionStatus status;
    private Double overallScore;
    private Double communicationScore;
    private Double technicalScore;
    private Double confidenceScore;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<QuestionDetail> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDetail {
        private Long questionId;
        private Integer questionIndex;
        private String questionText;
        private String category;
        private List<String> expectedKeywords;

        private String transcribedText;
        private Integer responseDuration;
        private List<String> keywordsMatched;
        private List<String> keywordsMissing;
        private List<String> grammarIssues;

        private Double score;
        private String feedbackText;
        private String strengths;
        private String improvements;
        private String suggestedAnswer;
    }
}