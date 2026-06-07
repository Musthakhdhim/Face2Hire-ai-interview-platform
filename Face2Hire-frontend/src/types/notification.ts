export interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
}

export interface PaginatedNotifications {
    content: Notification[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}