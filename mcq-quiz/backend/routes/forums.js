const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Forum = require('../models/Forum');
const notificationService = require('../services/notificationService');

// @route   GET /api/forums
// @desc    Get all forum posts with filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { subject, search, page = 1, limit = 10, sortBy = 'createdAt' } = req.query;
        
        const query = {};
        if (subject) query.subject = subject;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const forums = await Forum.find(query)
            .populate('author', 'name profileImage role')
            .populate('replies.user', 'name profileImage role')
            .sort({ isPinned: -1, [sortBy]: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Forum.countDocuments(query);

        res.json({
            success: true,
            forums,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching forums:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/forums/:id
// @desc    Get single forum post with all replies
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        console.log(`📊 Fetching forum ${req.params.id} - incrementing views...`);
        
        const forum = await Forum.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        )
        .populate('author', 'name profileImage role')
        .populate('replies.user', 'name profileImage role');

        if (!forum) {
            return res.status(404).json({ message: 'Forum post not found' });
        }

        console.log(`✅ Forum fetched - Views: ${forum.views}`);
        res.json({ success: true, forum });
    } catch (error) {
        console.error('Error fetching forum:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/forums
// @desc    Create new forum post
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, subject, tags } = req.body;

        if (!title || !content || !subject) {
            return res.status(400).json({ message: 'Please provide title, content, and subject' });
        }

        const forum = await Forum.create({
            title,
            content,
            subject,
            tags: tags || [],
            author: req.user.id
        });

        await forum.populate('author', 'name profileImage role');

        res.status(201).json({ success: true, forum });
    } catch (error) {
        console.error('Error creating forum:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/forums/:id/reply
// @desc    Add reply to forum post
// @access  Private
router.post('/:id/reply', auth, async (req, res) => {
    try {
        const { content, parentReplyId } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Reply content is required' });
        }

        const forum = await Forum.findById(req.params.id);
        
        if (!forum) {
            return res.status(404).json({ message: 'Forum post not found' });
        }

        if (forum.isClosed) {
            return res.status(400).json({ message: 'This forum post is closed for replies' });
        }

        // If parentReplyId is provided, verify it exists
        if (parentReplyId) {
            const parentReply = forum.replies.id(parentReplyId);
            if (!parentReply) {
                return res.status(404).json({ message: 'Parent reply not found' });
            }
        }

        forum.replies.push({
            user: req.user.id,
            content,
            parentReply: parentReplyId || null
        });

        await forum.save();
        await forum.populate('replies.user', 'name profileImage role');

        // Notify the post author (if not replying to own post)
        if (forum.author.toString() !== req.user.id) {
            const User = require('../models/User');
            const repliedBy = await User.findById(req.user.id);
            await notificationService.notifyForumReply(forum.author, forum, repliedBy);
        }

        // If replying to another user's reply, notify them too
        if (parentReplyId) {
            const parentReply = forum.replies.id(parentReplyId);
            if (parentReply && parentReply.user.toString() !== req.user.id) {
                const User = require('../models/User');
                const repliedBy = await User.findById(req.user.id);
                await notificationService.notifyForumReply(parentReply.user, forum, repliedBy);
            }
        }

        res.json({ success: true, forum });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/forums/:id/like
// @desc    Like/unlike forum post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
    try {
        const forum = await Forum.findById(req.params.id);
        
        if (!forum) {
            return res.status(404).json({ message: 'Forum post not found' });
        }

        const likeIndex = forum.likes.indexOf(req.user.id);
        
        if (likeIndex > -1) {
            // Unlike
            forum.likes.splice(likeIndex, 1);
        } else {
            // Like
            forum.likes.push(req.user.id);
        }

        await forum.save();

        res.json({ success: true, likes: forum.likes.length, isLiked: likeIndex === -1 });
    } catch (error) {
        console.error('Error liking forum:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/forums/:forumId/reply/:replyId/like
// @desc    Like/unlike reply
// @access  Private
router.post('/:forumId/reply/:replyId/like', auth, async (req, res) => {
    try {
        const forum = await Forum.findById(req.params.forumId);
        
        if (!forum) {
            return res.status(404).json({ message: 'Forum post not found' });
        }

        const reply = forum.replies.id(req.params.replyId);
        
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }

        const likeIndex = reply.likes.indexOf(req.user.id);
        
        if (likeIndex > -1) {
            reply.likes.splice(likeIndex, 1);
        } else {
            reply.likes.push(req.user.id);
        }

        await forum.save();

        res.json({ success: true, likes: reply.likes.length, isLiked: likeIndex === -1 });
    } catch (error) {
        console.error('Error liking reply:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/forums/:forumId/reply/:replyId/best-answer
// @desc    Mark reply as best answer (author only)
// @access  Private
router.put('/:forumId/reply/:replyId/best-answer', auth, async (req, res) => {
    try {
        const forum = await Forum.findById(req.params.forumId);
        
        if (!forum) {
            return res.status(404).json({ message: 'Forum post not found' });
        }

        // Only post author can mark best answer
        if (forum.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only post author can mark best answer' });
        }

        // Remove best answer from all replies
        forum.replies.forEach(reply => reply.isBestAnswer = false);

        // Mark the selected reply as best answer
        const reply = forum.replies.id(req.params.replyId);
        if (reply) {
            reply.isBestAnswer = true;
            forum.isSolved = true;
        }

        await forum.save();

        res.json({ success: true, forum });
    } catch (error) {
        console.error('Error marking best answer:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/forums/:id
// @desc    Delete forum post (author only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const forum = await Forum.findById(req.params.id);
        
        if (!forum) {
            return res.status(404).json({ message: 'Forum post not found' });
        }

        if (forum.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await forum.deleteOne();

        res.json({ success: true, message: 'Forum post deleted' });
    } catch (error) {
        console.error('Error deleting forum:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/forums/subjects/list
// @desc    Get list of unique subjects
// @access  Public
router.get('/subjects/list', async (req, res) => {
    try {
        const subjects = await Forum.distinct('subject');
        res.json({ success: true, subjects });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
