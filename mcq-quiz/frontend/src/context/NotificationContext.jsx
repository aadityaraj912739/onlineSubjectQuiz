import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function useNotifications() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user, token } = useAuth();

    const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

    // Fetch notifications
    const fetchNotifications = async (options = {}) => {
        if (!token) return;

        try {
            setLoading(true);
            const { limit = 20, skip = 0, unreadOnly = false } = options;
            
            const response = await axios.get(`${API_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit, skip, unreadOnly }
            });

            if (response.data.success) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch unread count only
    const fetchUnreadCount = async () => {
        if (!token) return;

        try {
            const response = await axios.get(`${API_URL}/api/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Mark as read
    const markAsRead = async (notificationId) => {
        if (!token) return;

        try {
            const response = await axios.put(
                `${API_URL}/api/notifications/${notificationId}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif._id === notificationId ? { ...notif, isRead: true } : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        if (!token) return;

        try {
            const response = await axios.put(
                `${API_URL}/api/notifications/mark-all-read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, isRead: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        if (!token) return;

        try {
            const response = await axios.delete(
                `${API_URL}/api/notifications/${notificationId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setNotifications(prev =>
                    prev.filter(notif => notif._id !== notificationId)
                );
                // Recalculate unread count
                const deletedNotif = notifications.find(n => n._id === notificationId);
                if (deletedNotif && !deletedNotif.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Auto-fetch when user logs in
    useEffect(() => {
        if (user && token) {
            fetchNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, token]);

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
