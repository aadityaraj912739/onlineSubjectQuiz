const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        // Check if email credentials are configured
        console.log('📧 Initializing email service...');
        console.log('📧 SMTP_HOST:', process.env.SMTP_HOST ? '✓ Set' : '✗ Missing');
        console.log('📧 SMTP_USER:', process.env.SMTP_USER ? '✓ Set' : '✗ Missing');
        console.log('📧 SMTP_PASS:', process.env.SMTP_PASS ? '✓ Set' : '✗ Missing');
        console.log('📧 SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');

        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('⚠️  Email service not configured - email notifications will be skipped');
            console.log('💡 Add SMTP credentials to .env to enable email notifications');
            return;
        }

        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: true
                }
            });

            console.log('✅ Email service initialized successfully');
            console.log(`✅ Configured to send from: ${process.env.SMTP_USER}`);
            
            // Verify connection
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ SMTP Connection verification failed:', error.message);
                    console.error('❌ Full error:', error);
                } else {
                    console.log('✅ SMTP server connection verified successfully');
                }
            });
        } catch (error) {
            console.error('❌ Failed to initialize email service:', error.message);
            console.error('❌ Full error:', error);
        }
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.transporter) {
            console.log('⚠️  Email service not available - skipping email to:', to);
            return { success: false, message: 'Email service not configured' };
        }

        try {
            console.log(`📧 Attempting to send email to: ${to}`);
            console.log(`📧 Subject: ${subject}`);
            
            const mailOptions = {
                from: `"${process.env.APP_NAME || 'Quiz Platform'}" <${process.env.SMTP_USER}>`,
                to,
                subject,
                text,
                html
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully!');
            console.log('✅ Message ID:', info.messageId);
            console.log('✅ Response:', info.response);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Failed to send email to:', to);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error code:', error.code);
            console.error('❌ Full error:', JSON.stringify(error, null, 2));
            return { success: false, error: error.message };
        }
    }

    // Template: Exam Reminder
    async sendExamReminder(user, exam, hoursUntilExam) {
        const subject = `Reminder: Exam "${exam.title}" starts in ${hoursUntilExam} hours`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Exam Reminder</h2>
                <p>Hello ${user.name},</p>
                <p>This is a reminder that your exam is starting soon:</p>
                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${exam.title}</h3>
                    <p><strong>Subject:</strong> ${exam.subject}</p>
                    <p><strong>Start Time:</strong> ${new Date(exam.startTime).toLocaleString()}</p>
                    <p><strong>Duration:</strong> ${exam.questions.length * (exam.timePerQuestion || 1)} minutes</p>
                    <p><strong>Total Marks:</strong> ${exam.totalMarks}</p>
                </div>
                <p>Make sure you're prepared and ready on time!</p>
                <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                    If you have any questions, please contact your teacher.
                </p>
            </div>
        `;
        const text = `Hello ${user.name}, your exam "${exam.title}" starts in ${hoursUntilExam} hours. Start Time: ${new Date(exam.startTime).toLocaleString()}`;

        return this.sendEmail({ to: user.email, subject, html, text });
    }

    // Template: Result Published
    async sendResultNotification(user, exam, result) {
        const subject = `Result Published: ${exam.title}`;
        const percentage = ((result.obtainedMarks / exam.totalMarks) * 100).toFixed(2);
        const passed = percentage >= 40;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: ${passed ? '#10B981' : '#EF4444'};">
                    ${passed ? '🎉 Congratulations!' : '📊 Result Published'}
                </h2>
                <p>Hello ${user.name},</p>
                <p>Your result for the following exam has been published:</p>
                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${exam.title}</h3>
                    <p><strong>Marks Obtained:</strong> ${result.obtainedMarks} / ${exam.totalMarks}</p>
                    <p><strong>Percentage:</strong> ${percentage}%</p>
                    ${result.rank ? `<p><strong>Rank:</strong> ${result.rank}</p>` : ''}
                    <p><strong>Status:</strong> <span style="color: ${passed ? '#10B981' : '#EF4444'}; font-weight: bold;">
                        ${passed ? 'PASSED' : 'FAILED'}
                    </span></p>
                </div>
                <p>${passed ? 'Keep up the great work!' : 'Don\'t worry, keep practicing and you\'ll do better next time!'}</p>
                <a href="${process.env.FRONTEND_URL}/results" 
                   style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin-top: 20px;">
                    View Detailed Result
                </a>
            </div>
        `;
        const text = `Hello ${user.name}, your result for "${exam.title}" has been published. You scored ${result.obtainedMarks}/${exam.totalMarks} (${percentage}%).`;

        return this.sendEmail({ to: user.email, subject, html, text });
    }

    // Template: Doubt Answered
    async sendDoubtAnsweredNotification(student, doubt, answeredBy) {
        const subject = `Your doubt has been answered!`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">💡 Your Doubt Has Been Answered</h2>
                <p>Hello ${student.name},</p>
                <p>${answeredBy.name} has answered your doubt:</p>
                <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="font-weight: bold; color: #374151;">${doubt.question}</p>
                </div>
                <a href="${process.env.FRONTEND_URL}/doubts/${doubt._id}" 
                   style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin-top: 20px;">
                    View Answer
                </a>
            </div>
        `;
        const text = `Hello ${student.name}, ${answeredBy.name} has answered your doubt: "${doubt.question}"`;

        return this.sendEmail({ to: student.email, subject, html, text });
    }

    // Template: Study Group Invitation
    async sendStudyGroupInvitation(user, studyGroup, invitedBy) {
        const subject = `You've been invited to join "${studyGroup.name}"`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">👥 Study Group Invitation</h2>
                <p>Hello ${user.name},</p>
                <p>${invitedBy.name} has invited you to join their study group:</p>
                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${studyGroup.name}</h3>
                    <p><strong>Subject:</strong> ${studyGroup.subject}</p>
                    ${studyGroup.description ? `<p>${studyGroup.description}</p>` : ''}
                    <p><strong>Members:</strong> ${studyGroup.members.length}</p>
                </div>
                <a href="${process.env.FRONTEND_URL}/study-groups/${studyGroup._id}" 
                   style="display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin-top: 20px;">
                    Join Study Group
                </a>
            </div>
        `;
        const text = `Hello ${user.name}, ${invitedBy.name} has invited you to join the study group "${studyGroup.name}" (${studyGroup.subject})`;

        return this.sendEmail({ to: user.email, subject, html, text });
    }
}

module.exports = new EmailService();
