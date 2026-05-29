import axiosClient from './axiosClient';
import API from './endpoints';

// Types
export type InterviewType = 'technical' | 'hr' | 'behavioral' | 'salary';
export type Difficulty = 'beginner' | 'intermediate' | 'expert';
export type AvatarStyle = 'professional' | 'friendly' | 'strict';
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export interface StartSessionRequest {
  type: InterviewType;
  difficulty: Difficulty;
  duration: number;       // minutes
  questionCount: number;
  avatarStyle: AvatarStyle;
  scheduledInterviewId?: number;
}

export interface SessionStartedDto {
  sessionId: number;
  firstQuestionId: number;
  totalQuestions: number;
  durationSeconds: number;
}

export interface QuestionResponseDto {
  questionId: number;
  questionIndex: number;
  questionText: string;
  category: string;
  expectedKeywords: string[];
}

export interface AnswerSubmissionDto {
  sessionId: number;
  questionId: number;
  audioUrl: string;
  responseDuration: number; // seconds
}

export interface FeedbackResponseDto {
  questionId: number;
  score: number;
  feedbackText: string;
  strengths: string;
  improvements: string;
  suggestedAnswer: string;
  keywordsMatched: string[];
  keywordsMissing: string[];
  grammarIssues: string[];
}

export interface OverallFeedbackDto {
  overallScore: number;
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  strengths: string;
  improvements: string;
  detailedFeedback: string;
  suggestedResources: string[];
}

export interface InterviewSessionDto {
  id: number;
  type: InterviewType;
  difficulty: Difficulty;
  duration: number;
  questionCount: number;
  avatarStyle: AvatarStyle;
  status: SessionStatus;
  overallScore?: number;
  communicationScore?: number;
  technicalScore?: number;
  confidenceScore?: number;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  scheduledInterviewId?: number; // added for scheduled interviews
}

export const interviewService = {
  startSession: async (data: StartSessionRequest): Promise<SessionStartedDto> => {
    const response = await axiosClient.post(API.INTERVIEW.START, data);
    return response.data.data;
  },

  submitAnswer: async (data: AnswerSubmissionDto): Promise<FeedbackResponseDto> => {
    const response = await axiosClient.post(API.INTERVIEW.SUBMIT_ANSWER, data);
    return response.data.data;
  },

  getNextQuestion: async (sessionId: number, currentQuestionId: number): Promise<QuestionResponseDto> => {
    const response = await axiosClient.get(API.INTERVIEW.NEXT_QUESTION(sessionId, currentQuestionId));
    return response.data.data;
  },

  endSession: async (sessionId: number): Promise<OverallFeedbackDto> => {
    const response = await axiosClient.post(API.INTERVIEW.END(sessionId));
    return response.data.data;
  },

  getOverallFeedback: async (sessionId: number): Promise<OverallFeedbackDto> => {
    const response = await axiosClient.get(API.INTERVIEW.FEEDBACK(sessionId));
    return response.data.data;
  },

  getUserSessions: async (): Promise<InterviewSessionDto[]> => {
    const response = await axiosClient.get(API.INTERVIEW.MY_SESSIONS);
    return response.data.data;
  },
};