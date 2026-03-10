const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const Contact = require('../models/Contact');
const emailService = require('../services/emailService');

// Admin email address
const ADMIN_EMAIL = 'ar912739@gmail.com';

// @route   POST /api/contact
// @desc    Send contact/support email to admin
// @access  Public (can be used by logged in and guest users)
router.post('/', optionalAuth, async (req, res) => {
  try {
    console.log('[Contact] Received contact form submission');
    const { name, email, subject, category, priority, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.log('[Contact] Validation failed - missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields (name, email, subject, message)' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[Contact] Validation failed - invalid email format');
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // Create contact submission in database
    console.log('[Contact] Saving to database');
    const contactSubmission = new Contact({
      name,
      email,
      subject,
      category: category || 'General Query',
      priority: priority || 'medium',
      message,
      userId: req.user ? req.user.id : null,
      status: 'pending'
    });

    await contactSubmission.save();
    console.log('[Contact] Saved to database with ID:', contactSubmission._id);

    // Capture user info before async operation
    const userInfo = req.user ? {
      id: req.user.id,
      role: req.user.role
    } : null;

    // Send response immediately - don't wait for email
    res.json({ 
      success: true, 
      message: 'Your message has been received successfully. We will get back to you soon!',
      submissionId: contactSubmission._id
    });

    // Send email in background (non-blocking)
    setImmediate(async () => {
      try {
        console.log('[Contact] Attempting to send email notification (background)');
        
        if (!emailService.transporter) {
          console.log('[Contact] Email service not configured, skipping email notification');
          return;
        }

        // Priority emoji
        const priorityEmoji = {
          'urgent': '🚨',
          'high': '⚠️',
          'medium': 'ℹ️',
          'low': '📝'
        };

        // Prepare email content
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <div style="background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">${priorityEmoji[priority] || 'ℹ️'} New Support Request</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Category: ${category} | Priority: ${priority.toUpperCase()}</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
                <h3 style="color: #1f2937; margin: 0 0 10px 0;">Contact Information</h3>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #4F46E5;">${email}</a></p>
                ${userInfo ? `<p style="margin: 5px 0; color: #4b5563;"><strong>User ID:</strong> ${userInfo.id}</p>` : ''}
                ${userInfo ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Role:</strong> ${userInfo.role}</p>` : ''}
              </div>
              
              <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
                <h3 style="color: #1f2937; margin: 0 0 10px 0;">Subject</h3>
                <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${subject}</p>
              </div>
              
              <div>
                <h3 style="color: #1f2937; margin: 0 0 10px 0;">Message</h3>
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5;">
                  <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
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
New Support Request

Category: ${category}
Priority: ${priority.toUpperCase()}

Contact Information:
- Name: ${name}
- Email: ${email}
${userInfo ? `- User ID: ${userInfo.id}` : ''}
${userInfo ? `- Role: ${userInfo.role}` : ''}

Subject: ${subject}

Message:
${message}

Submitted: ${new Date().toLocaleString()}
        `.trim();

        console.log('[Contact] Sending email to:', ADMIN_EMAIL);
        const result = await emailService.sendEmail({
          to: ADMIN_EMAIL,
          subject: `[${priority.toUpperCase()}] ${category}: ${subject}`,
          html: emailHtml,
          text: emailText
        });

        if (result.success) {
          console.log('[Contact] ✅ Email sent successfully:', result.messageId);
          contactSubmission.emailSent = true;
          contactSubmission.emailSentAt = new Date();
          await contactSubmission.save();
        } else {
          console.error('[Contact] ❌ Failed to send email:', result.error || result.message);
          console.error('[Contact] ❌ Email was NOT sent to admin');
        }
      } catch (emailError) {
        console.error('[Contact] ❌ Exception sending email (non-fatal):', emailError.message);
        console.error('[Contact] ❌ Stack:', emailError.stack);
      }
    });

  } catch (error) {
    console.error('[Contact] Database error:', error);
    console.error('[Contact] Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while submitting your message. Please try again later or contact us at ar912739@gmail.com'
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contact submissions (admin only)
// @access  Private (Teacher)
const { auth, isTeacher } = require('../middleware/auth');

router.get('/', auth, isTeacher, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = status ? { status } : {};
    
    const contacts = await Contact.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Contact.countDocuments(query);
    
    res.json({
      success: true,
      contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('[Contact] Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact submissions'
    });
  }
});

// @route   GET /api/contact/:id
// @desc    Get single contact submission (admin only)
// @access  Private (Teacher)
router.get('/:id', auth, isTeacher, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('respondedBy', 'name email');
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }
    
    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('[Contact] Error fetching submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact submission'
    });
  }
});

// @route   PATCH /api/contact/:id/status
// @desc    Update contact submission status (admin only)
// @access  Private (Teacher)
router.patch('/:id/status', auth, isTeacher, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }
    
    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('[Contact] Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
});

module.exports = router;
