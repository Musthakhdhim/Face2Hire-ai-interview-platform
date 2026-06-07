import axiosClient from './axiosClient';

export interface EmailRequest {
    subject: string;
    body: string;
    recipientType: 'MARKETING' | 'EMAIL_UPDATES' | 'ALL_USERS';
}

export const adminEmailService = {
    sendBulkEmail: async (request: EmailRequest): Promise<void> => {
        await axiosClient.post('/admin/email/send', request);
    }
};