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
    applicationId?: number;
    minimumScore?: number;
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
    applicationId?: number;    
    minimumScore?: number;  
    completed?: boolean;      
}

export const scheduledInterviewService = {
    schedule: async (data: ScheduleInterviewRequest): Promise<ScheduledInterviewDto> => {
        const response = await axiosClient.post(API.SCHEDULED_INTERVIEWS.CREATE, data);
        return response.data;
    },
    getMyScheduled: async (): Promise<ScheduledInterviewDto[]> => {
        const response = await axiosClient.get(API.SCHEDULED_INTERVIEWS.MY);
        return response.data;
    },
    getForInterviewer: async (): Promise<ScheduledInterviewDto[]> => {
        const response = await axiosClient.get(API.SCHEDULED_INTERVIEWS.FOR_INTERVIEWER);
        return response.data;
    },
    getByApplicationId: async (applicationId: number): Promise<ScheduledInterviewDto> => {
        const response = await axiosClient.get(`/scheduled-interviews/application/${applicationId}`);
        return response.data;
    },
    getById: async (scheduledId: number): Promise<ScheduledInterviewDto> => {
        const response = await axiosClient.get(`/scheduled-interviews/${scheduledId}`);
        return response.data;
    },
};