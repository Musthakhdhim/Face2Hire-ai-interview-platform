import axiosClient from './axiosClient';
import API from './endpoints';
import type { InterviewType, Difficulty, AvatarStyle } from './interviewService';

export interface ScheduleInterviewRequest {
  intervieweeId: number;
  intervieweeName: string;
  type: InterviewType;
  difficulty: Difficulty;
  duration: number;
  questionCount: number;
  avatarStyle: AvatarStyle;
  dueDate: string; 
}

export interface ScheduledInterviewDto {
  id: number;
  intervieweeId: number;
  intervieweeName: string;
  type: InterviewType;
  difficulty: Difficulty;
  duration: number;
  questionCount: number;
  avatarStyle: AvatarStyle;
  scheduledByInterviewer: string;
  dueDate: string;
  createdAt: string;
}

export const scheduledInterviewService = {
  schedule: async (data: ScheduleInterviewRequest): Promise<ScheduledInterviewDto> => {
    const response = await axiosClient.post(API.SCHEDULED_INTERVIEWS.CREATE, data);
    return response.data;   // ✅ backend returns the DTO directly
  },

  getMyScheduled: async (): Promise<ScheduledInterviewDto[]> => {
    const response = await axiosClient.get(API.SCHEDULED_INTERVIEWS.MY);
    return response.data;   // ✅ backend returns list directly
  },

  getForInterviewer: async (): Promise<ScheduledInterviewDto[]> => {
    const response = await axiosClient.get(API.SCHEDULED_INTERVIEWS.FOR_INTERVIEWER);
    return response.data;   // ✅ backend returns list directly
  },
};
