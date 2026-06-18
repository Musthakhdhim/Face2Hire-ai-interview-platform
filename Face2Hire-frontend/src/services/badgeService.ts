import axiosClient from './axiosClient';
import type { Badge } from '../types/badge';

export const badgeService = {
    // Admin endpoints
    getAllBadges: async (): Promise<Badge[]> => {
        const response = await axiosClient.get('/admin/badges');
        return response.data.data;
    },
    getBadges: async (type?: string, page = 0, size = 20): Promise<{ content: Badge[], totalPages: number }> => {
        const response = await axiosClient.get('/admin/badges/list', { params: { type, page, size } });
        return response.data.data;
    },
    createBadge: async (badge: Omit<Badge, 'id' | 'createdAt'>): Promise<Badge> => {
        const response = await axiosClient.post('/admin/badges', badge);
        return response.data.data;
    },
    updateBadge: async (id: number, badge: Partial<Badge>): Promise<Badge> => {
        const response = await axiosClient.put(`/admin/badges/${id}`, badge);
        return response.data.data;
    },
    deleteBadge: async (id: number): Promise<void> => {
        await axiosClient.delete(`/admin/badges/${id}`);
    },
    awardBadge: async (userId: number, badgeId: number): Promise<void> => {
        await axiosClient.post('/admin/badges/award', null, { params: { userId, badgeId } });
    },
    getUserBadges: async (): Promise<Badge[]> => {
        const response = await axiosClient.get('/profile/badges');
        return response.data.data;
    },

    checkForNewBadges: async (previousBadges: Badge[]): Promise<Badge[]> => {
        const currentBadges = await badgeService.getUserBadges();
        const newBadges = currentBadges.filter(
            current => !previousBadges.some(prev => prev.id === current.id)
        );
        return newBadges;
    },
};