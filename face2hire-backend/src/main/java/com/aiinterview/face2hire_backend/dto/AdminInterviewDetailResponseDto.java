package com.aiinterview.face2hire_backend.dto;

import com.aiinterview.face2hire_backend.entity.interview.InterviewType;
import com.aiinterview.face2hire_backend.entity.interview.Difficulty;
import com.aiinterview.face2hire_backend.entity.interview.SessionStatus;
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
public class AdminInterviewDetailResponseDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private InterviewType type;
    private Difficulty difficulty;
    private Integer duration;
    private Integer questionCount;
    private SessionStatus status;
    private Double overallScore;
    private Double communicationScore;
    private Double technicalScore;
    private Double confidenceScore;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private Boolean isScheduled;
    private Long scheduledInterviewId;

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

        private Long responseId;
        private String audioUrl;
        private String transcribedText;
        private Integer responseDuration;
        private Double confidenceScore;
        private Integer speakingRateWpm;
        private Integer fillerWordCount;
        private Double sentimentScore;
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
