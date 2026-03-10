const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const HelpDesk = require('../models/HelpDesk');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

// Admin email address
const ADMIN_EMAIL = 'ar912739@gmail.com';

// @route   GET /api/helpdesk
// @desc    Get all tickets (with filters for admin, personal for users)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { status, category, priority, assignedToMe } = req.query;
        
        let query = {};
        
        // If student, only show their tickets
        if (req.user.role === 'student') {
            query.user = req.user.id;
        } else if (req.user.role === 'teacher') {
            // Teachers can see all or just assigned to them
            if (assignedToMe === 'true') {
                query.assignedTo = req.user.id;
            }
        }
        
        // Apply filters
        if (status) query.status = status;
        if (category) query.category = category;
        if (priority) query.priority = priority;

        const tickets = await HelpDesk.find(query)
            .populate({
                path: 'user',
                select: 'name email profileImage role',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'assignedTo',
                select: 'name email',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'messages.sender',
                select: 'name profileImage role',
                options: { strictPopulate: false }
            })
            .sort({ updatedAt: -1 })
            .lean();

        // Filter out tickets with missing user references
        const validTickets = tickets.filter(ticket => ticket.user);

        res.json({ success: true, tickets: validTickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/helpdesk/stats
// @desc    Get help desk statistics (admin only)
// @access  Private (Teacher)
router.get('/stats', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const stats = await HelpDesk.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalTickets = await HelpDesk.countDocuments();
        const openTickets = await HelpDesk.countDocuments({ status: { $in: ['open', 'in-progress', 'waiting-for-user'] } });
        const resolvedTickets = await HelpDesk.countDocuments({ status: 'resolved' });
        const avgRating = await HelpDesk.aggregate([
            { $match: { rating: { $exists: true } } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        res.json({
            success: true,
            stats: {
                total: totalTickets,
                open: openTickets,
                resolved: resolvedTickets,
                statusBreakdown: stats,
                averageRating: avgRating[0]?.avgRating || 0
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/helpdesk/:id
// @desc    Get single ticket with all messages
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const ticket = await HelpDesk.findById(req.params.id)
            .populate({
                path: 'user',
                select: 'name email profileImage role',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'assignedTo',
                select: 'name email',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'messages.sender',
                select: 'name profileImage role',
                options: { strictPopulate: false }
            })
            .lean();

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (!ticket.user) {
            return res.status(404).json({ message: 'Ticket has invalid user reference' });
        }

        // Check if user has access to this ticket
        if (req.user.role === 'student' && ticket.user._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Mark as read (need to find and update without lean)
        const ticketToUpdate = await HelpDesk.findById(req.params.id);
        if (ticketToUpdate) {
            if (req.user.role === 'teacher') {
                ticketToUpdate.unreadByAdmin = false;
            } else {
                ticketToUpdate.unreadByUser = false;
            }
            await ticketToUpdate.save();
        }

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error fetching ticket:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/helpdesk
// @desc    Create new support ticket
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { subject, category, priority, initialMessage, attachments } = req.body;

        if (!subject || !initialMessage) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        const ticket = new HelpDesk({
            user: req.user.id,
            subject,
            category: category || 'General Query',
            priority: priority || 'medium',
            messages: [{
                sender: req.user.id,
                content: initialMessage,
                attachments: attachments || []
            }],
            lastResponseBy: req.user.id,
            lastResponseAt: new Date(),
            unreadByAdmin: true,
            unreadByUser: false
        });

        await ticket.save();
        await ticket.populate('user', 'name email profileImage role');
        await ticket.populate('messages.sender', 'name profileImage role');

        // Capture user info before async operations
        const userInfo = {
            name: req.user.name,
            email: req.user.email,
            id: req.user.id,
            role: req.user.role
        };

        // Notify all teachers about new ticket
        const teachers = await User.find({ role: 'teacher' });
        for (const teacher of teachers) {
            await notificationService.createNotification({
                userId: teacher._id,
                type: 'support',
                title: 'New Help Desk Ticket',
                message: `New help desk ticket: ${subject}`
            });
        }

        res.status(201).json({ success: true, ticket });

        // Send email to admin in background (non-blocking)
        setImmediate(async () => {
            try {
                console.log('[HelpDesk] Attempting to send email notification (background)');
                
                if (!emailService.transporter) {
                    console.log('[HelpDesk] Email service not configured, skipping email notification');
                    return;
                }

                // Priority emoji
                const priorityEmoji = {
                    'urgent': '🚨',
                    'high': '⚠️',
                    'medium': 'ℹ️',
                    'low': '📝'
                };

                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                        <div style="background-color: #DC2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                            <h2 style="margin: 0;">${priorityEmoji[priority] || 'ℹ️'} New Help Desk Ticket</h2>
                            <p style="margin: 5px 0 0 0; opacity: 0.9;">Category: ${category} | Priority: ${priority.toUpperCase()}</p>
                        </div>
                        
                        <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
                                <h3 style="color: #1f2937; margin: 0 0 10px 0;">User Information</h3>
                                <p style="margin: 5px 0; color: #4b5563;"><strong>Name:</strong> ${userInfo.name}</p>
                                <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> <a href="mailto:${userInfo.email}" style="color: #DC2626;">${userInfo.email}</a></p>
                                <p style="margin: 5px 0; color: #4b5563;"><strong>User ID:</strong> ${userInfo.id}</p>
                                <p style="margin: 5px 0; color: #4b5563;"><strong>Role:</strong> ${userInfo.role}</p>
                            </div>
                            
                            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
                                <h3 style="color: #1f2937; margin: 0 0 10px 0;">Subject</h3>
                                <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${subject}</p>
                            </div>
                            
                            <div>
                                <h3 style="color: #1f2937; margin: 0 0 10px 0;">Message</h3>
                                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #DC2626;">
                                    <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${initialMessage}</p>
                                </div>
                            </div>
                            
                            ${attachments && attachments.length > 0 ? `
                            <div style="margin-top: 20px;">
                                <h3 style="color: #1f2937; margin: 0 0 10px 0;">Attachments</h3>
                                <ul style="margin: 0; padding-left: 20px;">
                                    ${attachments.map(att => `<li style="color: #4b5563;">${att.name || att.url}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div style="margin-top: 20px; padding: 15px; background-color: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
                            <p style="margin: 0; color: #92400E; font-size: 14px;">
                                <strong>⏰ Submitted:</strong> ${new Date().toLocaleString('en-US', { 
                                    dateStyle: 'full', 
                                    timeStyle: 'long' 
                                })}
                            </p>
                        </div>
                    </div>
                `;

                const emailText = `
New Help Desk Ticket

Category: ${category}
Priority: ${priority.toUpperCase()}

User Information:
- Name: ${userInfo.name}
- Email: ${userInfo.email}
- User ID: ${userInfo.id}
- Role: ${userInfo.role}

Subject: ${subject}

Message:
${initialMessage}

Submitted: ${new Date().toLocaleString()}
                `.trim();

                console.log('[HelpDesk] Sending email to:', ADMIN_EMAIL);
                const result = await emailService.sendEmail({
                    to: ADMIN_EMAIL,
                    subject: `[${priority.toUpperCase()}] Help Desk: ${subject}`,
                    html: emailHtml,
                    text: emailText
                });

                if (result.success) {
                    console.log('[HelpDesk] ✅ Email sent successfully:', result.messageId);
                } else {
                    console.error('[HelpDesk] ❌ Failed to send email:', result.error || result.message);
                    console.error('[HelpDesk] ❌ Email was NOT sent to admin');
                }
            } catch (emailError) {
                console.error('[HelpDesk] ❌ Exception sending email (non-fatal):', emailError.message);
                console.error('[HelpDesk] ❌ Stack:', emailError.stack);
            }
        });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/helpdesk/:id/message
// @desc    Add a message to ticket
// @access  Private
router.post('/:id/message', auth, async (req, res) => {
    try {
        const { content, attachments } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const ticket = await HelpDesk.findById(req.params.id)
            .populate('user', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check access
        const isOwner = ticket.user._id.toString() === req.user.id;
        const isAdmin = req.user.role === 'teacher';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Add message
        ticket.messages.push({
            sender: req.user.id,
            content,
            attachments: attachments || []
        });

        ticket.lastResponseBy = req.user.id;
        ticket.lastResponseAt = new Date();

        // Update unread flags
        if (req.user.role === 'teacher') {
            ticket.unreadByUser = true;
            ticket.unreadByAdmin = false;
            // Auto-update status when admin responds
            if (ticket.status === 'open') {
                ticket.status = 'in-progress';
            }
        } else {
            ticket.unreadByAdmin = true;
            ticket.unreadByUser = false;
            // If user responds while waiting, mark as open
            if (ticket.status === 'waiting-for-user') {
                ticket.status = 'open';
            }
        }

        await ticket.save();
        await ticket.populate('messages.sender', 'name profileImage role');

        // Capture user and ticket info before async operations
        const senderInfo = {
            name: req.user.name,
            email: req.user.email,
            id: req.user.id,
            role: req.user.role
        };
        
        const ticketInfo = {
            subject: ticket.subject,
            category: ticket.category,
            priority: ticket.priority
        };

        // Send notification
        const recipientId = req.user.role === 'teacher' ? ticket.user._id : ticket.assignedTo;
        if (recipientId) {
            await notificationService.createNotification({
                userId: recipientId,
                type: 'support',
                title: 'New Help Desk Message',
                message: `New message in ticket: ${ticket.subject}`
            });
        }

        res.json({ success: true, ticket });

        // Send email to admin only when student replies (non-blocking)
        if (req.user.role === 'student') {
            setImmediate(async () => {
                try {
                    console.log('[HelpDesk] Student replied - sending email notification (background)');
                    
                    if (!emailService.transporter) {
                        console.log('[HelpDesk] Email service not configured, skipping email notification');
                        return;
                    }

                    const priorityEmoji = {
                        'urgent': '🚨',
                        'high': '⚠️',
                        'medium': 'ℹ️',
                        'low': '📝'
                    };

                    const emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                            <div style="background-color: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                                <h2 style="margin: 0;">💬 New Reply on Help Desk Ticket</h2>
                                <p style="margin: 5px 0 0 0; opacity: 0.9;">Student has responded to their ticket</p>
                            </div>
                            
                            <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
                                    <h3 style="color: #1f2937; margin: 0 0 10px 0;">Ticket Information</h3>
                                    <p style="margin: 5px 0; color: #4b5563;"><strong>Subject:</strong> ${ticketInfo.subject}</p>
                                    <p style="margin: 5px 0; color: #4b5563;"><strong>Category:</strong> ${ticketInfo.category}</p>
                                    <p style="margin: 5px 0; color: #4b5563;"><strong>Priority:</strong> ${priorityEmoji[ticketInfo.priority] || 'ℹ️'} ${ticketInfo.priority.toUpperCase()}</p>
                                </div>
                                
                                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
                                    <h3 style="color: #1f2937; margin: 0 0 10px 0;">Student Information</h3>
                                    <p style="margin: 5px 0; color: #4b5563;"><strong>Name:</strong> ${senderInfo.name}</p>
                                    <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> <a href="mailto:${senderInfo.email}" style="color: #059669;">${senderInfo.email}</a></p>
                                </div>
                                
                                <div>
                                    <h3 style="color: #1f2937; margin: 0 0 10px 0;">New Message</h3>
                                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #059669;">
                                        <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${content}</p>
                                    </div>
                                </div>
                                
                                ${attachments && attachments.length > 0 ? `
                                <div style="margin-top: 20px;">
                                    <h3 style="color: #1f2937; margin: 0 0 10px 0;">Attachments</h3>
                                    <ul style="margin: 0; padding-left: 20px;">
                                        ${attachments.map(att => `<li style="color: #4b5563;">${att.name || att.url}</li>`).join('')}
                                    </ul>
                                </div>
                                ` : ''}
                            </div>
                            
                            <div style="margin-top: 20px; padding: 15px; background-color: #DBEAFE; border-radius: 8px; border-left: 4px solid #3B82F6;">
                                <p style="margin: 0; color: #1E3A8A; font-size: 14px;">
                                    <strong>⏰ Replied At:</strong> ${new Date().toLocaleString('en-US', { 
                                        dateStyle: 'full', 
                                        timeStyle: 'long' 
                                    })}
                                </p>
                            </div>
                        </div>
                    `;

                    const emailText = `
New Reply on Help Desk Ticket

Ticket: ${ticketInfo.subject}
Category: ${ticketInfo.category}
Priority: ${ticketInfo.priority.toUpperCase()}

Student: ${senderInfo.name} (${senderInfo.email})

New Message:
${content}

Replied At: ${new Date().toLocaleString()}
                    `.trim();

                    console.log('[HelpDesk] Sending reply notification email to:', ADMIN_EMAIL);
                    const result = await emailService.sendEmail({
                        to: ADMIN_EMAIL,
                        subject: `[REPLY] ${ticketInfo.subject}`,
                        html: emailHtml,
                        text: emailText
                    });

                    if (result.success) {
                        console.log('[HelpDesk] ✅ Reply notification email sent successfully:', result.messageId);
                    } else {
                        console.error('[HelpDesk] ❌ Failed to send reply notification email:', result.error || result.message);
                        console.error('[HelpDesk] ❌ Reply email was NOT sent to admin');
                    }
                } catch (emailError) {
                    console.error('[HelpDesk] ❌ Exception sending reply notification email (non-fatal):', emailError.message);
                    console.error('[HelpDesk] ❌ Stack:', emailError.stack);
                }
            });
        }
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PATCH /api/helpdesk/:id/status
// @desc    Update ticket status (admin only)
// @access  Private (Teacher)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { status } = req.body;

        if (!['open', 'in-progress', 'waiting-for-user', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const ticket = await HelpDesk.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('user', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Notify user
        await notificationService.createNotification({
            userId: ticket.user._id,
            type: 'support',
            title: 'Ticket Status Updated',
            message: `Your ticket status changed to: ${status}`
        });

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PATCH /api/helpdesk/:id/assign
// @desc    Assign ticket to teacher (admin only)
// @access  Private (Teacher)
router.patch('/:id/assign', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { assignedTo } = req.body;

        const ticket = await HelpDesk.findByIdAndUpdate(
            req.params.id,
            { assignedTo: assignedTo || req.user.id },
            { new: true }
        ).populate('assignedTo', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Notify assigned teacher
        if (assignedTo && assignedTo !== req.user.id) {
            await notificationService.createNotification({
                userId: assignedTo,
                type: 'support',
                title: 'Ticket Assigned',
                message: `You've been assigned to ticket: ${ticket.subject}`
            });
        }

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error assigning ticket:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/helpdesk/:id/rating
// @desc    Rate a resolved ticket (user only)
// @access  Private
router.post('/:id/rating', auth, async (req, res) => {
    try {
        const { rating, feedback } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const ticket = await HelpDesk.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Only ticket owner can rate
        if (ticket.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Only resolved/closed tickets can be rated
        if (!['resolved', 'closed'].includes(ticket.status)) {
            return res.status(400).json({ message: 'Can only rate resolved or closed tickets' });
        }

        ticket.rating = rating;
        ticket.feedback = feedback || '';
        await ticket.save();

        res.json({ success: true, ticket });
    } catch (error) {
        console.error('Error rating ticket:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/helpdesk/:id
// @desc    Delete a ticket (admin only or ticket owner if no responses)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const ticket = await HelpDesk.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check permissions
        const isOwner = ticket.user.toString() === req.user.id;
        const isAdmin = req.user.role === 'teacher';
        const hasNoResponses = ticket.messages.length <= 1;

        if (!isAdmin && (!isOwner || !hasNoResponses)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await HelpDesk.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
