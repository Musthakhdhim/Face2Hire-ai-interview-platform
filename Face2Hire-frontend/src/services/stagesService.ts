import axiosClient from './axiosClient';

export type StageType = 'TECHNICAL' | 'HR' | 'BEHAVIORAL' | 'SALARY';
export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'SKIPPED';

export interface StageConfigDto {
    stageType: string;
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

    
    approveStage: async (stageId: number, applicationId: number, score: number, feedback?: string): Promise<ApplicationStage> => {
        const response = await axiosClient.post(
            `/applications/stages/${stageId}/approve`,
            { feedback },
            { params: { applicationId, score } }
        );
        return response.data.data;
    },

    rejectStage: async (stageId: number, applicationId: number, feedback?: string): Promise<ApplicationStage> => {
        const response = await axiosClient.post(
            `/applications/stages/${stageId}/reject`,
            { feedback },
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