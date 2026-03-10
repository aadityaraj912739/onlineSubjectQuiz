const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    attachments: [{
        url: {
            type: String
        },
        publicId: {
            type: String
        },
        fileName: {
            type: String
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const helpDeskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Technical Issue', 'Account', 'Exam Related', 'General Query', 'Feature Request', 'Other'],
        default: 'General Query'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'waiting-for-user', 'resolved', 'closed'],
        default: 'open'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    messages: [messageSchema],
    lastResponseBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastResponseAt: {
        type: Date
    },
    unreadByUser: {
        type: Boolean,
        default: false
    },
    unreadByAdmin: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    feedback: {
        type: String
    }
}, {
    timestamps: true
});

// Index for faster queries
helpDeskSchema.index({ status: 1, createdAt: -1 });
helpDeskSchema.index({ user: 1, createdAt: -1 });
helpDeskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('HelpDesk', helpDeskSchema);
