import axiosClient from './axiosClient';
import type { UserListResponseDto, UserFilterRequest } from '../types/user';

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

export const userService = {
    // Get filtered and paginated users
    getUsers: async (filter: UserFilterRequest): Promise<PaginatedResponse<UserListResponseDto>> => {
        const response = await axiosClient.post('/admin/users', filter);
        // The backend returns ApiResponse<Page<UserListResponseDto>>
        // Page is serialized as { content, totalElements, totalPages, size, number, ... }
        return response.data.data;
    },

    blockUser: async (userId: number): Promise<void> => {
        await axiosClient.put(`/admin/users/block/${userId}`);
    },
    unblockUser: async (userId: number): Promise<void> => {
        await axiosClient.put(`/admin/users/unblock/${userId}`);
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
};