const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');

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

    // Import email service
    console.log('[Contact] Importing email service');
    const emailService = require('../services/emailService');
    
    // Check if email service is configured
    if (!emailService.transporter) {
      console.error('[Contact] Email service not configured - transporter is null');
      return res.status(503).json({ 
        success: false, 
        message: 'Email service is not configured. Please contact support directly at ar912739@gmail.com'
      });
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
            ${req.user ? `<p style="margin: 5px 0; color: #4b5563;"><strong>User ID:</strong> ${req.user.id}</p>` : ''}
            ${req.user ? `<p style="margin: 5px 0; color: #4b5563;"><strong>Role:</strong> ${req.user.role}</p>` : ''}
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
${req.user ? `- User ID: ${req.user.id}` : ''}
${req.user ? `- Role: ${req.user.role}` : ''}

Subject: ${subject}

Message:
${message}

Submitted: ${new Date().toLocaleString()}
    `.trim();

    // Send email to admin
    console.log('[Contact] Attempting to send email to:', ADMIN_EMAIL);
    console.log('[Contact] Email subject:', `[${priority.toUpperCase()}] ${category}: ${subject}`);
    
    const result = await emailService.sendEmail({
      to: ADMIN_EMAIL,
      subject: `[${priority.toUpperCase()}] ${category}: ${subject}`,
      html: emailHtml,
      text: emailText
    });

    console.log('[Contact] Email send result:', result);

    if (result.success) {
      console.log('[Contact] Email sent successfully');
      res.json({ 
        success: true, 
        message: 'Your message has been sent successfully. We will get back to you soon!'
      });
    } else {
      // Even if email fails, we should inform the user gracefully
      console.error('[Contact] Failed to send email:', result.error || result.message);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send your message. Please try again later or email us directly at ar912739@gmail.com'
      });
    }

  } catch (error) {
    console.error('[Contact] Unexpected error:', error);
    console.error('[Contact] Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while sending your message. Please try again later or contact us at ar912739@gmail.com'
    });
  }
});

module.exports = router;
