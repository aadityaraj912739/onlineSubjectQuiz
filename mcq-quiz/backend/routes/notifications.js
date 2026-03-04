const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { limit, skip, unreadOnly } = req.query;
        
        const options = {
            limit: limit ? parseInt(limit) : 20,
            skip: skip ? parseInt(skip) : 0,
            unreadOnly: unreadOnly === 'true'
        };

        const result = await notificationService.getUserNotifications(req.user.id, options);
        
        res.json({
            success: true,
            notifications: result.notifications,
            unreadCount: result.unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
    try {
        const Notification = require('../models/Notification');
        const count = await Notification.countDocuments({ 
            user: req.user.id, 
            isRead: false 
        });
        
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', auth, async (req, res) => {
    try {
        const result = await notificationService.markAllAsRead(req.user.id);
        
        res.json({ 
            success: true, 
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user.id);
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        res.json({ success: true, notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const notification = await notificationService.deleteNotification(req.params.id, req.user.id);
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/notifications/test
// @desc    Test notification (development only)
// @access  Private
router.post('/test', auth, async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ message: 'Test endpoint not available in production' });
        }

        const notification = await notificationService.createNotification({
            userId: req.user.id,
            type: 'exam_reminder',
            title: 'Test Notification',
            message: 'This is a test notification from the system',
            sendEmail: req.body.sendEmail || false
        });
        
        res.json({ success: true, notification });
    } catch (error) {
        console.error('Error creating test notification:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
