const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Doubt = require('../models/Doubt');
const notificationService = require('../services/notificationService');

// @route   GET /api/doubts
// @desc    Get all doubts with filters
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { subject, isResolved, myDoubts } = req.query;
        
        const query = {};
        
        if (subject) query.subject = subject;
        if (isResolved !== undefined) query.isResolved = isResolved === 'true';
        if (myDoubts === 'true') query.student = req.user.id;

        const doubts = await Doubt.find(query)
            .populate('student', 'name profileImage')
            .populate('answers.user', 'name profileImage role')
            .sort({ createdAt: -1 });

        res.json({ success: true, doubts });
    } catch (error) {
        console.error('Error fetching doubts:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/doubts/:id
// @desc    Get single doubt with all answers
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const doubt = await Doubt.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        )
        .populate('student', 'name profileImage email')
        .populate('answers.user', 'name profileImage role');

        if (!doubt) {
            return res.status(404).json({ message: 'Doubt not found' });
        }

        res.json({ success: true, doubt });
    } catch (error) {
        console.error('Error fetching doubt:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/doubts
// @desc    Create new doubt
// @access  Private (students only)
router.post('/', auth, async (req, res) => {
    try {
        const { question, subject, topic, imageUrl, tags, priority } = req.body;

        if (!question || !subject) {
            return res.status(400).json({ message: 'Please provide question and subject' });
        }

        const doubt = await Doubt.create({
            student: req.user.id,
            question,
            subject,
            topic,
            imageUrl,
            tags: tags || [],
            priority: priority || 'medium'
        });

        await doubt.populate('student', 'name profileImage');

        res.status(201).json({ success: true, doubt });
    } catch (error) {
        console.error('Error creating doubt:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/doubts/:id/answer
// @desc    Add answer to doubt
// @access  Private
router.post('/:id/answer', auth, async (req, res) => {
    try {
        const { content, imageUrl } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Answer content is required' });
        }

        const doubt = await Doubt.findById(req.params.id);
        
        if (!doubt) {
            return res.status(404).json({ message: 'Doubt not found' });
        }

        doubt.answers.push({
            user: req.user.id,
            content,
            imageUrl
        });

        await doubt.save();
        await doubt.populate('answers.user', 'name profileImage role');

        // Notify the student (if not answering own doubt)
        if (doubt.student.toString() !== req.user.id) {
            const User = require('../models/User');
            const answeredBy = await User.findById(req.user.id);
            await notificationService.notifyDoubtAnswered(doubt.student, doubt, answeredBy);
        }

        res.json({ success: true, doubt });
    } catch (error) {
        console.error('Error adding answer:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/doubts/:doubtId/answer/:answerId/upvote
// @desc    Upvote an answer
// @access  Private
router.post('/:doubtId/answer/:answerId/upvote', auth, async (req, res) => {
    try {
        const doubt = await Doubt.findById(req.params.doubtId);
        
        if (!doubt) {
            return res.status(404).json({ message: 'Doubt not found' });
        }

        const answer = doubt.answers.id(req.params.answerId);
        
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        // Remove from downvotes if exists
        const downvoteIndex = answer.downvotes.indexOf(req.user.id);
        if (downvoteIndex > -1) {
            answer.downvotes.splice(downvoteIndex, 1);
        }

        // Toggle upvote
        const upvoteIndex = answer.upvotes.indexOf(req.user.id);
        if (upvoteIndex > -1) {
            answer.upvotes.splice(upvoteIndex, 1);
        } else {
            answer.upvotes.push(req.user.id);
        }

        await doubt.save();

        res.json({ 
            success: true, 
            upvotes: answer.upvotes.length,
            downvotes: answer.downvotes.length
        });
    } catch (error) {
        console.error('Error upvoting answer:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/doubts/:doubtId/answer/:answerId/downvote
// @desc    Downvote an answer
// @access  Private
router.post('/:doubtId/answer/:answerId/downvote', auth, async (req, res) => {
    try {
        const doubt = await Doubt.findById(req.params.doubtId);
        
        if (!doubt) {
            return res.status(404).json({ message: 'Doubt not found' });
        }

        const answer = doubt.answers.id(req.params.answerId);
        
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        // Remove from upvotes if exists
        const upvoteIndex = answer.upvotes.indexOf(req.user.id);
        if (upvoteIndex > -1) {
            answer.upvotes.splice(upvoteIndex, 1);
        }

        // Toggle downvote
        const downvoteIndex = answer.downvotes.indexOf(req.user.id);
        if (downvoteIndex > -1) {
            answer.downvotes.splice(downvoteIndex, 1);
        } else {
            answer.downvotes.push(req.user.id);
        }

        await doubt.save();

        res.json({ 
            success: true, 
            upvotes: answer.upvotes.length,
            downvotes: answer.downvotes.length
        });
    } catch (error) {
        console.error('Error downvoting answer:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/doubts/:doubtId/answer/:answerId/best-answer
// @desc    Mark answer as best answer (student only)
// @access  Private
router.put('/:doubtId/answer/:answerId/best-answer', auth, async (req, res) => {
    try {
        const doubt = await Doubt.findById(req.params.doubtId);
        
        if (!doubt) {
            return res.status(404).json({ message: 'Doubt not found' });
        }

        // Only doubt owner can mark best answer
        if (doubt.student.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the student who asked can mark best answer' });
        }

        // Remove best answer from all answers
        doubt.answers.forEach(answer => answer.isBestAnswer = false);

        // Mark the selected answer as best
        const answer = doubt.answers.id(req.params.answerId);
        if (answer) {
            answer.isBestAnswer = true;
            doubt.isResolved = true;
        }

        await doubt.save();

        res.json({ success: true, doubt });
    } catch (error) {
        console.error('Error marking best answer:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/doubts/:id
// @desc    Delete doubt (owner only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const doubt = await Doubt.findById(req.params.id);
        
        if (!doubt) {
            return res.status(404).json({ message: 'Doubt not found' });
        }

        if (doubt.student.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this doubt' });
        }

        await doubt.deleteOne();

        res.json({ success: true, message: 'Doubt deleted' });
    } catch (error) {
        console.error('Error deleting doubt:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
