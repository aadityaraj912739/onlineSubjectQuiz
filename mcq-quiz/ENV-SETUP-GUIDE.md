# Environment Variables Setup Guide

This guide explains all the environment variables required for the application's new features (Email Notifications and Collaborative Features).

## ⚠️ IMPORTANT

**NEVER commit `.env` files to git!** These files contain sensitive credentials and should remain local only.

---

## Backend Environment Variables

Add these variables to `mcq-quiz/backend/.env`:

### Email Notification Service (Required for Email Features)

```bash
# SMTP Configuration (Gmail Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application Name (Optional - shown in emails)
APP_NAME=Quiz Platform
```

### SMS Notification Service (Optional)

```bash
# Twilio Configuration (for SMS notifications)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Setup Instructions

### 1. Gmail SMTP Setup (For Email Notifications)

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Quiz Platform" as the name
   - Click "Generate"
   - Copy the 16-character password

3. **Add to `.env` file**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # The 16-character app password
   ```

### 2. Alternative SMTP Providers

#### SendGrid (Recommended for Production)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

### 3. Twilio SMS Setup (Optional)

1. **Create Twilio Account**
   - Go to: https://www.twilio.com/try-twilio
   - Sign up for free trial

2. **Get Credentials**
   - After signup, go to Twilio Console
   - Copy "Account SID" and "Auth Token"
   - Get a Twilio phone number

3. **Add to `.env` file**
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=+15551234567
   ```

---

## Features Enabled by Environment Variables

### With Email Service Configured:
- ✅ Exam reminders sent via email
- ✅ Result published notifications via email
- ✅ Doubt answered email alerts
- ✅ Study group invitations via email
- ✅ Weekly digest emails (future)

### Without Email Service:
- ✅ In-app notifications (bell icon) still work
- ⚠️ Email notifications are skipped (logged in console)
- ⚠️ Users only see notifications when logged in

### With SMS Service Configured:
- 📱 SMS alerts for urgent notifications (future feature)
- 📱 Exam reminders via SMS

---

## Testing Email Service

### 1. Start the backend server:
```bash
cd mcq-quiz/backend
npm run dev
```

### 2. Check console output:
- ✅ **Success**: `✅ Email service initialized successfully`
- ⚠️ **Warning**: `⚠️  Email service not configured - email notifications will be skipped`

### 3. Test notification endpoint (Development only):
```bash
POST http://localhost:5001/api/notifications/test
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sendEmail": true
}
```

---

## Troubleshooting

### Email Not Sending

**Problem**: "Email service not configured" warning

**Solution**:
1. Check `.env` file has all SMTP variables
2. Restart backend server: `npm run dev`
3. Verify app password is correct (not your regular Gmail password)

**Problem**: "Authentication failed"

**Solution**:
1. Generate new App Password from Gmail
2. Enable "Less secure app access" (not recommended - use App Password instead)
3. Check username is full email address (e.g., `user@gmail.com`)

**Problem**: Emails going to spam

**Solution**:
1. Add `FROM_EMAIL` to match `SMTP_USER` in `.env`
2. Use production SMTP service (SendGrid, Mailgun)
3. Configure SPF and DKIM records for your domain

### SMS Not Sending

**Problem**: Twilio authentication error

**Solution**:
1. Verify Account SID starts with "AC"
2. Check Auth Token is correct
3. Ensure phone number includes country code (e.g., +1 for US)

**Problem**: Phone number not verified

**Solution**:
1. For Twilio trial accounts, verify recipient phone numbers in console
2. Upgrade to paid account for unrestricted sending

---

## Security Best Practices

1. **Never commit `.env` files**
   - Already in `.gitignore`
   - Double-check before pushing to GitHub

2. **Use environment-specific `.env` files**
   ```
   .env.development
   .env.production
   .env.test
   ```

3. **Rotate credentials regularly**
   - Change app passwords every 90 days
   - Regenerate API keys periodically

4. **Use secrets management in production**
   - Render: Use "Environment" tab in dashboard
   - Vercel: Use "Environment Variables" in project settings
   - AWS: Use AWS Secrets Manager or Parameter Store

5. **Restrict API key permissions**
   - SendGrid: Only grant "Mail Send" permission
   - Twilio: Only enable SMS sending

---

## Production Deployment

### Render (Backend)

1. Go to your service in Render dashboard
2. Click "Environment" tab
3. Add environment variables:
   - Click "Add Environment Variable"
   - Enter `SMTP_HOST`, value `smtp.gmail.com`
   - Repeat for all email variables
4. Click "Save Changes"
5. Service will automatically redeploy

### Vercel (Frontend)

Frontend doesn't need any new environment variables for these features. All API calls use existing `REACT_APP_BACKEND_URL`.

---

## Complete Backend `.env` Example

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your-jwt-secret-key-minimum-32-characters
SESSION_SECRET=your-session-secret-key

# Server
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Notifications (NEW)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
APP_NAME=Quiz Platform

# SMS Notifications (OPTIONAL)
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_PHONE_NUMBER=+1234567890
```

---

## Support

If you encounter issues:
1. Check server console for specific error messages
2. Verify all environment variables are set correctly
3. Restart the server after changing `.env` file
4. Test with a simple email first before complex notifications

**Note**: Email service is optional. The application will work perfectly fine without it - notifications will only appear in-app (bell icon).
