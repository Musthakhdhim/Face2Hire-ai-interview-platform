import axiosClient from './axiosClient';
import type { Notification, PaginatedNotifications } from '../types/notification';

export const notificationService = {
    getUnreadCount: async (): Promise<number> => {
        const response = await axiosClient.get('/notifications/count');
        return response.data.data;
    },
    getUnread: async (): Promise<Notification[]> => {
        const response = await axiosClient.get('/notifications/unread');
        return response.data.data;
    },
    getAll: async (page = 0, size = 10): Promise<PaginatedNotifications> => {
        const response = await axiosClient.get('/notifications', { params: { page, size } });
        return response.data.data;
    },
    markAsRead: async (id: number): Promise<void> => {
        await axiosClient.put(`/notifications/${id}/read`);
    },
    markAllAsRead: async (): Promise<void> => {
        await axiosClient.put('/notifications/read-all');
    },
};