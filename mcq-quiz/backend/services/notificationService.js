const Notification = require('../models/Notification');
const emailService = require('./emailService');

class NotificationService {
    // Create and send notification
    async createNotification({ userId, type, title, message, relatedExam, relatedResult, relatedForum, sendEmail = false }) {
        try {
            const notification = await Notification.create({
                user: userId,
                type,
                title,
                message,
                relatedExam,
                relatedResult,
                relatedForum,
                isSent: true,
                sentAt: new Date(),
                emailSent: false
            });

            // Send email if requested and user has email
            if (sendEmail) {
                const User = require('../models/User');
                const user = await User.findById(userId);
                
                if (user && user.email) {
                    const emailResult = await this.sendEmailNotification(user, notification);
                    notification.emailSent = emailResult.success;
                    await notification.save();
                }
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Send email for notification
    async sendEmailNotification(user, notification) {
        const subject = notification.title;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">${notification.title}</h2>
                <p>Hello ${user.name},</p>
                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p>${notification.message}</p>
                </div>
                <a href="${process.env.FRONTEND_URL}" 
                   style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin-top: 20px;">
                    Go to Platform
                </a>
            </div>
        `;
        const text = notification.message;

        return emailService.sendEmail({ to: user.email, subject, html, text });
    }

    // Get user notifications
    async getUserNotifications(userId, options = {}) {
        const { limit = 20, skip = 0, unreadOnly = false } = options;
        
        const query = { user: userId };
        if (unreadOnly) {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('relatedExam', 'title subject startTime')
            .populate('relatedResult', 'obtainedMarks percentage')
            .populate('relatedForum', 'title');

        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

        return { notifications, unreadCount };
    }

    // Mark notification as read
    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, user: userId },
            { isRead: true },
            { new: true }
        );
        return notification;
    }

    // Mark all notifications as read
    async markAllAsRead(userId) {
        const result = await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true }
        );
        return result;
    }

    // Delete notification
    async deleteNotification(notificationId, userId) {
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            user: userId
        });
        return notification;
    }

    // Specific notification types
    async notifyExamReminder(userId, exam, hoursUntilExam) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        await this.createNotification({
            userId,
            type: 'exam_reminder',
            title: `Exam Reminder: ${exam.title}`,
            message: `Your exam "${exam.title}" starts in ${hoursUntilExam} hours on ${new Date(exam.startTime).toLocaleString()}`,
            relatedExam: exam._id,
            sendEmail: false
        });

        // Send detailed email
        if (user && user.email) {
            await emailService.sendExamReminder(user, exam, hoursUntilExam);
        }
    }

    async notifyResultPublished(userId, exam, result) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        const percentage = ((result.obtainedMarks / exam.totalMarks) * 100).toFixed(2);
        
        await this.createNotification({
            userId,
            type: 'result_published',
            title: `Result Published: ${exam.title}`,
            message: `Your result has been published! You scored ${result.obtainedMarks}/${exam.totalMarks} (${percentage}%)`,
            relatedExam: exam._id,
            relatedResult: result._id,
            sendEmail: false
        });

        // Send detailed email
        if (user && user.email) {
            await emailService.sendResultNotification(user, exam, result);
        }
    }

    async notifyDoubtAnswered(studentId, doubt, answeredBy) {
        const User = require('../models/User');
        const student = await User.findById(studentId);
        
        await this.createNotification({
            userId: studentId,
            type: 'doubt_answered',
            title: 'Your doubt has been answered!',
            message: `${answeredBy.name} answered your doubt: "${doubt.question.substring(0, 50)}..."`,
            sendEmail: false
        });

        // Send detailed email
        if (student && student.email) {
            await emailService.sendDoubtAnsweredNotification(student, doubt, answeredBy);
        }
    }

    async notifyForumReply(userId, forum, repliedBy) {
        await this.createNotification({
            userId,
            type: 'forum_reply',
            title: 'New reply on your post',
            message: `${repliedBy.name} replied to your forum post: "${forum.title}"`,
            relatedForum: forum._id,
            sendEmail: false
        });
    }

    async notifyStudyGroupInvite(userId, studyGroup, invitedBy) {
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        await this.createNotification({
            userId,
            type: 'study_group_invite',
            title: `Invitation to join "${studyGroup.name}"`,
            message: `${invitedBy.name} invited you to join the study group "${studyGroup.name}" (${studyGroup.subject})`,
            sendEmail: false
        });

        // Send detailed email
        if (user && user.email) {
            await emailService.sendStudyGroupInvitation(user, studyGroup, invitedBy);
        }
    }
}

module.exports = new NotificationService();
