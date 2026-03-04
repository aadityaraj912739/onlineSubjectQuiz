const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const StudyGroup = require('../models/StudyGroup');
const notificationService = require('../services/notificationService');

// @route   GET /api/study-groups
// @desc    Get all study groups (public only) or user's groups
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { subject, myGroups } = req.query;
        
        let query = {};
        
        if (myGroups === 'true') {
            // Get groups where user is a member
            query['members.user'] = req.user.id;
        } else {
            // Get all public groups
            query.isPrivate = false;
        }

        if (subject) {
            query.subject = subject;
        }

        const studyGroups = await StudyGroup.find(query)
            .populate('creator', 'name profileImage')
            .populate('members.user', 'name profileImage')
            .sort({ createdAt: -1 });

        res.json({ success: true, studyGroups });
    } catch (error) {
        console.error('Error fetching study groups:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/study-groups/:id
// @desc    Get single study group
// @access  Private (members only)
router.get('/:id', auth, async (req, res) => {
    try {
        const studyGroup = await StudyGroup.findById(req.params.id)
            .populate('creator', 'name profileImage email')
            .populate('members.user', 'name profileImage role')
            .populate('messages.user', 'name profileImage')
            .populate('sharedNotes.uploadedBy', 'name profileImage');

        if (!studyGroup) {
            return res.status(404).json({ message: 'Study group not found' });
        }

        // Check if user is a member
        const isMember = studyGroup.members.some(m => m.user._id.toString() === req.user.id);
        
        if (!isMember && studyGroup.isPrivate) {
            return res.status(403).json({ message: 'This is a private study group' });
        }

        res.json({ success: true, studyGroup, isMember });
    } catch (error) {
        console.error('Error fetching study group:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/study-groups
// @desc    Create new study group
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, subject, isPrivate, maxMembers } = req.body;

        if (!name || !subject) {
            return res.status(400).json({ message: 'Please provide name and subject' });
        }

        const studyGroup = await StudyGroup.create({
            name,
            description,
            subject,
            creator: req.user.id,
            isPrivate: isPrivate || false,
            maxMembers: maxMembers || 50,
            members: [{
                user: req.user.id,
                role: 'admin'
            }]
        });

        await studyGroup.populate('creator', 'name profileImage');
        await studyGroup.populate('members.user', 'name profileImage');

        res.status(201).json({ success: true, studyGroup });
    } catch (error) {
        console.error('Error creating study group:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/study-groups/:id/join
// @desc    Join a study group
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
    try {
        const studyGroup = await StudyGroup.findById(req.params.id);

        if (!studyGroup) {
            return res.status(404).json({ message: 'Study group not found' });
        }

        // Check if already a member
        const isMember = studyGroup.members.some(m => m.user.toString() === req.user.id);
        if (isMember) {
            return res.status(400).json({ message: 'You are already a member of this group' });
        }

        // Check if group is full
        if (studyGroup.members.length >= studyGroup.maxMembers) {
            return res.status(400).json({ message: 'This study group is full' });
        }

        studyGroup.members.push({
            user: req.user.id,
            role: 'member'
        });

        await studyGroup.save();
        await studyGroup.populate('members.user', 'name profileImage');

        res.json({ success: true, studyGroup });
    } catch (error) {
        console.error('Error joining study group:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/study-groups/:id/leave
// @desc    Leave a study group
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
    try {
        const studyGroup = await StudyGroup.findById(req.params.id);

        if (!studyGroup) {
            return res.status(404).json({ message: 'Study group not found' });
        }

        // Check if creator
        if (studyGroup.creator.toString() === req.user.id) {
            return res.status(400).json({ message: 'Group creator cannot leave. Transfer ownership or delete the group.' });
        }

        // Remove member
        studyGroup.members = studyGroup.members.filter(m => m.user.toString() !== req.user.id);

        await studyGroup.save();

        res.json({ success: true, message: 'You have left the study group' });
    } catch (error) {
        console.error('Error leaving study group:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/study-groups/:id/message
// @desc    Send message to study group
// @access  Private (members only)
router.post('/:id/message', auth, async (req, res) => {
    try {
        const { content, type, fileUrl } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const studyGroup = await StudyGroup.findById(req.params.id);

        if (!studyGroup) {
            return res.status(404).json({ message: 'Study group not found' });
        }

        // Check if user is a member
        const isMember = studyGroup.members.some(m => m.user.toString() === req.user.id);
        if (!isMember) {
            return res.status(403).json({ message: 'You must be a member to send messages' });
        }

        studyGroup.messages.push({
            user: req.user.id,
            content,
            type: type || 'text',
            fileUrl
        });

        await studyGroup.save();
        await studyGroup.populate('messages.user', 'name profileImage');

        // Get the last message (the one just added)
        const lastMessage = studyGroup.messages[studyGroup.messages.length - 1];

        res.json({ success: true, message: lastMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/study-groups/:id/invite
// @desc    Invite user to study group
// @access  Private (admin/moderator only)
router.post('/:id/invite', auth, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const studyGroup = await StudyGroup.findById(req.params.id);

        if (!studyGroup) {
            return res.status(404).json({ message: 'Study group not found' });
        }

        // Check if requester is admin/moderator
        const requesterMember = studyGroup.members.find(m => m.user.toString() === req.user.id);
        if (!requesterMember || (requesterMember.role !== 'admin' && requesterMember.role !== 'moderator')) {
            return res.status(403).json({ message: 'Only admins and moderators can invite members' });
        }

        // Check if user is already a member
        const isAlreadyMember = studyGroup.members.some(m => m.user.toString() === userId);
        if (isAlreadyMember) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        // Send notification
        const User = require('../models/User');
        const invitedBy = await User.findById(req.user.id);
        await notificationService.notifyStudyGroupInvite(userId, studyGroup, invitedBy);

        res.json({ success: true, message: 'Invitation sent successfully' });
    } catch (error) {
        console.error('Error inviting user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/study-groups/:id
// @desc    Delete study group (creator only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const studyGroup = await StudyGroup.findById(req.params.id);

        if (!studyGroup) {
            return res.status(404).json({ message: 'Study group not found' });
        }

        if (studyGroup.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the creator can delete this group' });
        }

        await studyGroup.deleteOne();

        res.json({ success: true, message: 'Study group deleted successfully' });
    } catch (error) {
        console.error('Error deleting study group:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
