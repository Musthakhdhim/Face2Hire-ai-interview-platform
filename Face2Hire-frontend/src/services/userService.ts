import axiosClient from './axiosClient';
import type { UserListResponseDto, UserFilterRequest } from '../types/user';
import type { ActivityFilter, ActivityLog, AdminReportsDto, AdminUserDetailResponse } from '../types/admin';
import API from './endpoints';

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalInterviews: number;
  premiumUsers: number;
}

export interface UserGrowthDataPoint {
    month: string;  
    users: number;
}

export interface UserSearchResult {
    id: number;
    name: string;
    email: string;
}

export interface InterviewVolumePoint {
    type: string;
    count: number;
}

export const userService = {
    getUsers: async (filter: UserFilterRequest): Promise<PaginatedResponse<UserListResponseDto>> => {
        const response = await axiosClient.post('/admin/users', filter);
        return response.data.data;
    },

    blockUser: async (userId: number): Promise<void> => {
        await axiosClient.put(`/admin/users/block/${userId}`);
    },
    unblockUser: async (userId: number): Promise<void> => {
        await axiosClient.put(`/admin/users/unblock/${userId}`);
    },

    searchByEmail: async (email: string): Promise<UserSearchResult[]> => {
        const response = await axiosClient.get('/users/search', { params: { email } });
        return response.data;
    },
    getUserDetail: async (userId: number): Promise<AdminUserDetailResponse> => {
        const response = await axiosClient.get(API.ADMIN.USER_DETAIL(userId));
        return response.data.data;
    },
};

export const adminService = {
    getStats: async (): Promise<AdminStats> => {
        const response = await axiosClient.get('/admin/stats');
        return response.data.data;
    },

    getUserGrowth: async (): Promise<UserGrowthDataPoint[]> => {
        const response = await axiosClient.get('/admin/user-growth');
        return response.data.data;
    },

    getInterviewVolume: async (): Promise<InterviewVolumePoint[]> => {
        const response = await axiosClient.get('/admin/interview-volume');
        return response.data.data;
    },
    
    getReports: async (startDate?: string, endDate?: string): Promise<AdminReportsDto> => {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const response = await axiosClient.get(API.ADMIN.REPORTS, { params });
        return response.data.data;
    },
};

export const activityService = {
    getRecent: async (): Promise<ActivityLog[]> => {
        const response = await axiosClient.get('/admin/activities/recent');
        return response.data.data;
    },
    getList: async (filter: ActivityFilter): Promise<PaginatedResponse<ActivityLog>> => {
        const response = await axiosClient.post('/admin/activities/list', filter);
        return response.data.data;
    },
};