import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const [count, unread] = await Promise.all([
                    notificationService.getUnreadCount(),
                    notificationService.getUnread(),
                ]);
                if (isMounted) {
                    setUnreadCount(count);
                    setRecentNotifications(unread.slice(0, 5));
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };

        fetchData();
        const interval = setInterval(() => fetchData(), 30000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: number) => {
        await notificationService.markAsRead(id);
        // Refresh data after marking as read
        try {
            const [count, unread] = await Promise.all([
                notificationService.getUnreadCount(),
                notificationService.getUnread(),
            ]);
            setUnreadCount(count);
            setRecentNotifications(unread.slice(0, 5));
        } catch (error) {
            console.error('Failed to refresh notifications', error);
        }
    };

    const handleMarkAllRead = async () => {
        await notificationService.markAllAsRead();
        try {
            const [count, unread] = await Promise.all([
                notificationService.getUnreadCount(),
                notificationService.getUnread(),
            ]);
            setUnreadCount(count);
            setRecentNotifications(unread.slice(0, 5));
        } catch (error) {
            console.error('Failed to refresh notifications', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 size-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-3 border-b flex justify-between items-center">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No new notifications
                            </div>
                        ) : (
                            recentNotifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-indigo-50' : ''}`}
                                    onClick={() => handleMarkAsRead(notif.id)}
                                >
                                    <div className="font-medium text-sm">{notif.title}</div>
                                    <div className="text-xs text-gray-600 mt-1">{notif.message}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-2 border-t text-center">
                        <Link
                            to={`/${window.location.pathname.split('/')[1]}/notifications`}
                            className="text-sm text-indigo-600 hover:underline"
                            onClick={() => setIsOpen(false)}
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}