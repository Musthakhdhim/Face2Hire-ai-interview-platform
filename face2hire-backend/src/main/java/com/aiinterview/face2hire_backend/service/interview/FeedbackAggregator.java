package com.aiinterview.face2hire_backend.service.interview;

import com.aiinterview.face2hire_backend.dto.interview.OverallFeedbackDto;
import com.aiinterview.face2hire_backend.entity.interview.QuestionFeedback;
import java.util.List;

public interface FeedbackAggregator {
    OverallFeedbackDto aggregate(Long sessionId, List<QuestionFeedback> feedbackList);
}