import axiosClient from './axiosClient';

export type StageType = 'TECHNICAL' | 'HR' | 'BEHAVIORAL' | 'SALARY';
export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
export type InterviewMode = 'AI' | 'ZOOM';

export interface StageConfigDto {
    stageType: string;
    interviewMode?: InterviewMode;
    order: number;
    minimumScore: number;
    duration: number;
    questionCount: number;
    required: boolean;
    description: string;
}

export interface WorkflowConfigDto {
    stages: StageConfigDto[];
    enabled: boolean;
}

export interface ApplicationStage {
    id: number;
    applicationId: number;
    stageOrder: number;
    stageType: StageType;
    interviewMode?: InterviewMode;
    status: StageStatus;
    minimumScore: number | null;
    actualScore: number | null;
    scheduledInterviewId: number | null;
    startedAt: string | null;
    completedAt: string | null;
    feedback: string | null;
    isCompleted: boolean;
    isLocked: boolean;
}

export interface StageDecisionPayload {
    stageId?: number;
    approved?: boolean;
    score?: number;
    communicationScore?: number;
    technicalScore?: number;
    confidenceScore?: number;
    strengths?: string;
    improvements?: string;
    feedback?: string;
}

export const stagesService = {
   
    getApplicationStages: async (applicationId: number): Promise<ApplicationStage[]> => {
        const response = await axiosClient.get(`/applications/stages/application/${applicationId}`);
        return response.data.data;
    },

    getCurrentStage: async (applicationId: number): Promise<ApplicationStage> => {
        const response = await axiosClient.get(`/applications/stages/application/${applicationId}/current`);
        return response.data.data;
    },

    
    getStageById: async (stageId: number): Promise<ApplicationStage> => {
        const response = await axiosClient.get(`/applications/stages/${stageId}`);
        return response.data.data;
    },

    
    startStage: async (stageId: number, applicationId: number, scheduledInterviewId: number): Promise<ApplicationStage> => {
        const response = await axiosClient.post(
            `/applications/stages/${stageId}/start`,
            null,
            { params: { applicationId, scheduledInterviewId } }
        );
        return response.data.data;
    },

    
    approveStage: async (
        stageId: number,
        applicationId: number,
        score: number,
        feedbackOrPayload?: string | StageDecisionPayload
    ): Promise<ApplicationStage> => {
        const body: StageDecisionPayload = typeof feedbackOrPayload === 'string'
            ? { feedback: feedbackOrPayload, score, approved: true }
            : { ...(feedbackOrPayload || {}), score, approved: true };
        const response = await axiosClient.post(
            `/applications/stages/${stageId}/approve`,
            body,
            { params: { applicationId, score } }
        );
        return response.data.data;
    },

    rejectStage: async (
        stageId: number,
        applicationId: number,
        feedbackOrPayload?: string | StageDecisionPayload
    ): Promise<ApplicationStage> => {
        const body: StageDecisionPayload = typeof feedbackOrPayload === 'string'
            ? { feedback: feedbackOrPayload, approved: false }
            : { ...(feedbackOrPayload || {}), approved: false };
        const response = await axiosClient.post(
            `/applications/stages/${stageId}/reject`,
            body,
            { params: { applicationId } }
        );
        return response.data.data;
    },

    
    skipStage: async (stageId: number, applicationId: number, reason?: string): Promise<ApplicationStage> => {
        const response = await axiosClient.post(
            `/applications/stages/${stageId}/skip`,
            { reason },
            { params: { applicationId } }
        );
        return response.data.data;
    },

    getNextStage: async (applicationId: number): Promise<ApplicationStage | null> => {
        const response = await axiosClient.get(`/applications/stages/application/${applicationId}/next`);
        return response.data.data;
    }
};