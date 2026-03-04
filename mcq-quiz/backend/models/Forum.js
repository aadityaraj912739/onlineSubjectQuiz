const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    parentReply: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reply',
        default: null
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isBestAnswer: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const forumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: false,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    replies: [replySchema],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isClosed: {
        type: Boolean,
        default: false
    },
    isSolved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for search and filtering
forumSchema.index({ subject: 1, createdAt: -1 });
forumSchema.index({ title: 'text', content: 'text' });
forumSchema.index({ author: 1 });

module.exports = mongoose.model('Forum', forumSchema);
