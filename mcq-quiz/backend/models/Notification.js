const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['exam_reminder', 'result_published', 'deadline_alert', 'doubt_answered', 'forum_reply', 'study_group_invite', 'weekly_digest'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedExam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam'
    },
    relatedResult: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Result'
    },
    relatedForum: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Forum'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isSent: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    smsSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
