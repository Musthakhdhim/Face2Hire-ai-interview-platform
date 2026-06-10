import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCheck, Bell } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { toast } from 'react-toastify';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
    const pageSize = 20;

    useEffect(() => {
        let isMounted = true;

        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const data = await notificationService.getAll(page, pageSize);
                if (isMounted) {
                    setNotifications(data.content);
                    setTotalPages(data.totalPages);
                }
            } catch (error) {
                console.error(error);
                if (isMounted) toast.error('Failed to load notifications');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchNotifications();

        return () => {
            isMounted = false;
        };
    }, [page, pageSize]);

    const handleMarkAsRead = async (id: number) => {
        // Prevent duplicate requests
        if (processingIds.has(id)) return;

        // Check if already read (optimistic update might have already set it)
        const notification = notifications.find(n => n.id === id);
        if (notification?.read) return;

        setProcessingIds(prev => new Set(prev).add(id));
        const previousNotifications = [...notifications];

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );

        try {
            await notificationService.markAsRead(id);
        } catch (error) {
            // Rollback on failure
            setNotifications(previousNotifications);
            toast.error('Failed to mark as read');
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const handleMarkAllRead = async () => {
        if (processingIds.size > 0) return;

        const allIds = notifications.map(n => n.id);
        setProcessingIds(new Set(allIds));
        const previousNotifications = [...notifications];

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        try {
            await notificationService.markAllAsRead();
            toast.success('All notifications marked as read');
        } catch (error) {
            setNotifications(previousNotifications);
            toast.error('Failed to mark all as read');
        } finally {
            setProcessingIds(new Set());
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600 mt-1">View and manage your notifications</p>
                </div>
                <Button
                    onClick={handleMarkAllRead}
                    variant="outline"
                    className="gap-2"
                    disabled={processingIds.size > 0 || notifications.length === 0}
                >
                    <CheckCheck className="size-4" /> Mark all as read
                </Button>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>All Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && <div className="text-center py-12">Loading...</div>}
                    {!loading && notifications.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Bell className="size-12 mx-auto mb-3 text-gray-300" />
                            No notifications yet
                        </div>
                    )}
                    <div className="space-y-3">
                        {notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`p-4 rounded-lg border transition-colors ${
                                    !notif.read && !processingIds.has(notif.id)
                                        ? 'bg-indigo-50 border-indigo-200 cursor-pointer hover:bg-indigo-100'
                                        : 'bg-white cursor-default'
                                }`}
                                onClick={() => !notif.read && !processingIds.has(notif.id) && handleMarkAsRead(notif.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="font-semibold">{notif.title}</div>
                                        <div className="text-sm text-gray-600 mt-1">{notif.message}</div>
                                        <div className="text-xs text-gray-400 mt-2">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    {!notif.read && (
                                        <Badge className="ml-2 bg-indigo-100 text-indigo-700 text-xs">New</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}