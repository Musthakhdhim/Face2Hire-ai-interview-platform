import axiosClient from './axiosClient';
import API from './endpoints';
import type { InterviewType, Difficulty, AvatarStyle } from './interviewService';
import type { InterviewMode, StageDecisionPayload } from './stagesService';

export type { InterviewMode };

export interface ScheduleInterviewRequest {
    intervieweeId: number;
    intervieweeName: string;
    type: InterviewType;
    interviewMode?: InterviewMode;
    difficulty?: Difficulty;
    duration: number;
    questionCount?: number;
    avatarStyle?: AvatarStyle;
    dueDate?: string;
    scheduledAt?: string;
    applicationId?: number;
    minimumScore?: number;
    stageId?: number;  
    applicationStageId?: number;
}

export interface ScheduledInterviewDto {
    id: number;
    intervieweeId: number;
    intervieweeName: string;
    intervieweeEmail?: string;
    type: InterviewType;
    interviewMode?: InterviewMode;
    difficulty: Difficulty;
    duration: number;
    questionCount: number;
    avatarStyle: AvatarStyle;
    scheduledByInterviewer: string;
    interviewerName?: string;
    dueDate: string;
    scheduledAt?: string;
    meetingId?: string;
    meetingJoinUrl?: string;
    meetingStartUrl?: string;
    meetingPasscode?: string;
    callEnded?: boolean;
    createdAt: string;
    applicationId?: number;    
    minimumScore?: number;  
    completed?: boolean;
    stageId?: number;
    applicationStageId?: number;      
}

export interface RoomParticipant {
    userId: number;
    name: string;
    email: string;
    role: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
    lastSeenEpochMs: number;
}

export interface RoomSignalMessage {
    senderId: number;
    senderName: string;
    type: 'OFFER' | 'ANSWER' | 'ICE' | 'PEER_JOINED' | 'PEER_LEFT';
    data: string;
    timestamp: number;
}

export interface RoomChatMessage {
    senderId: number;
    senderName: string;
    senderRole: string;
    text: string;
    timestamp: number;
}

export interface RoomStateResponse {
    roomEnded: boolean;
    participants: RoomParticipant[];
    signals: RoomSignalMessage[];
    messages: RoomChatMessage[];
}

export function getInterviewEffectiveDate(item: ScheduledInterviewDto): string {
    if (item.interviewMode === 'ZOOM' && item.scheduledAt) {
        return item.scheduledAt;
    }
    return item.dueDate || item.createdAt;
}

export function sortScheduledInterviewsByPriority(list: ScheduledInterviewDto[]): ScheduledInterviewDto[] {
    const now = Date.now();
    const getGroup = (item: ScheduledInterviewDto) => {
        if (item.completed) return 1;
        const effectiveMs = new Date(getInterviewEffectiveDate(item)).getTime();
        const isExpired = effectiveMs < now && !item.callEnded;
        return isExpired ? 2 : 0;
    };
    return [...list].sort((a, b) => {
        const gA = getGroup(a);
        const gB = getGroup(b);
        if (gA !== gB) return gA - gB;
        const tA = new Date(getInterviewEffectiveDate(a)).getTime();
        const tB = new Date(getInterviewEffectiveDate(b)).getTime();
        if (tA !== tB) return tB - tA;
        return b.id - a.id;
    });
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
    getByStageId: async (stageId: number): Promise<ScheduledInterviewDto> => {
        const response = await axiosClient.get(`/scheduled-interviews/stage/${stageId}`);
        return response.data;
    },
    endLiveCall: async (scheduledId: number): Promise<ScheduledInterviewDto> => {
        const response = await axiosClient.post(`/scheduled-interviews/${scheduledId}/end-call`);
        return response.data;
    },
    evaluateLiveInterview: async (scheduledId: number, decision: StageDecisionPayload): Promise<ScheduledInterviewDto> => {
        const response = await axiosClient.post(`/scheduled-interviews/${scheduledId}/evaluate`, decision);
        return response.data;
    },
    joinLiveRoom: async (scheduledId: number): Promise<RoomStateResponse> => {
        const response = await axiosClient.post(`/live-room/${scheduledId}/join`);
        return response.data;
    },
    getLiveRoomState: async (scheduledId: number): Promise<RoomStateResponse> => {
        const response = await axiosClient.get(`/live-room/${scheduledId}/state`);
        return response.data;
    },
    sendLiveRoomSignal: async (
        scheduledId: number,
        payload: { type: string; data: string; audioEnabled?: boolean; videoEnabled?: boolean }
    ): Promise<void> => {
        await axiosClient.post(`/live-room/${scheduledId}/signal`, payload);
    },
    leaveLiveRoom: async (scheduledId: number): Promise<void> => {
        await axiosClient.post(`/live-room/${scheduledId}/leave`);
    },
    endLiveRoomForAll: async (scheduledId: number): Promise<ScheduledInterviewDto> => {
        const response = await axiosClient.post(`/live-room/${scheduledId}/end`);
        return response.data;
    },
};