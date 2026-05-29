package com.aiinterview.face2hire_backend.entity.interview;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_responses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "audio_url")
    private String audioUrl;

    @Column(name = "transcribed_text", columnDefinition = "TEXT")
    private String transcribedText;

    @Column(name = "response_duration")
    private Integer responseDuration;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "speaking_rate_wpm")
    private Integer speakingRateWpm;

    @Column(name = "filler_word_count")
    private Integer fillerWordCount;

    @Column(name = "sentiment_score")
    private Double sentimentScore;

    @Column(name = "keywords_matched", columnDefinition = "JSON")
    private String keywordsMatched;

    @Column(name = "keywords_missing", columnDefinition = "JSON")
    private String keywordsMissing;

    @Column(name = "grammar_issues", columnDefinition = "JSON")
    private String grammarIssues;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}