# New Features - Email Notifications & Collaborative Learning

This document details the **Email & SMS Notifications** and **Collaborative Features** added to the Quiz Platform.

---

## 🚀 Features Overview

### 1. Email & SMS Notifications System

A comprehensive notification system with in-app and email delivery.

#### Notification Types:
- **Exam Reminders**: Get notified 24 hours before exam starts
- **Result Published**: Instant notification when teacher publishes results
- **Deadline Alerts**: Warnings for upcoming deadlines
- **Doubt Answered**: Get notified when someone answers your doubt
- **Forum Replies**: Notification when someone replies to your post
- **Study Group Invites**: Get invited to join study groups
- **Weekly Digest**: Summary of activity (planned)

#### Features:
- ✅ In-app notification bell with unread count
- ✅ Real-time notification dropdown
- ✅ Email delivery with beautiful HTML templates
- ✅ Mark as read/unread functionality
- ✅ Delete individual notifications
- ✅ Mark all as read
- ✅ Auto-polling for new notifications (every 30 seconds)
- ✅ Notification filtering (all/unread)
- ✅ Related entity links (exam, result, forum)

---

### 2. Discussion Forums

Community-driven Q&A and discussion platform.

#### Features:
- ✅ Create forum posts with title, content, subject, tags
- ✅ Reply to discussions
- ✅ Like posts and replies
- ✅ Mark best answer (post author only)
- ✅ Search discussions by keywords
- ✅ Filter by subject
- ✅ View count tracking
- ✅ Pin important discussions (future: admin only)
- ✅ Close discussions (future: author/admin)
- ✅ Solved status indicator
- ✅ Teacher badge on replies
- ✅ Real-time reply notifications

#### Forum Post Structure:
- Title, content, subject, tags
- Author information with profile picture
- Reply count, likes, views
- Timestamps (relative time)
- Best answer highlighting
- Nested replies with voting

---

### 3. Study Groups

Collaborative learning spaces for students.

#### Features:
- ✅ Create public/private study groups
- ✅ Join/leave groups
- ✅ Group chat messaging
- ✅ Share study materials (notes, PDFs)
- ✅ Invite members (admin/moderator only)
- ✅ Role-based permissions (admin, moderator, member)
- ✅ Member limit configuration
- ✅ Subject-based organization
- ✅ Message history
- ✅ File sharing support (future)
- ✅ Real-time chat (future: Socket.io)

#### Study Group Roles:
- **Admin**: Creator, full control, can delete group
- **Moderator**: Can invite members, moderate content
- **Member**: Can send messages, view shared notes

---

### 4. Doubts & Answers System

Dedicated doubt-solving platform (like Stack Overflow for students).

#### Features:
- ✅ Post doubts with question, subject, topic
- ✅ Add images to doubts
- ✅ Answer doubts
- ✅ Upvote/downvote answers
- ✅ Mark best answer (doubt owner only)
- ✅ Filter by subject and resolution status
- ✅ View my doubts
- ✅ Priority levels (low, medium, high)
- ✅ View count tracking
- ✅ Tag support for better organization

---

## 📁 Files Added/Modified

### Backend

#### New Models:
- `/models/Notification.js` - Notification schema with types, read status
- `/models/Forum.js` - Forum posts with replies, likes, views
- `/models/StudyGroup.js` - Study groups with members, messages, notes
- `/models/Doubt.js` - Doubts with answers, votes

#### New Services:
- `/services/emailService.js` - Email sending with Nodemailer
- `/services/notificationService.js` - Notification creation & management

#### New Routes:
- `/routes/notifications.js` - GET, PUT, DELETE notifications
- `/routes/forums.js` - CRUD for forums, replies, likes
- `/routes/studyGroups.js` - Group management, messaging, invites
- `/routes/doubts.js` - Doubt posting, answering, voting

#### Modified Files:
- `/server.js` - Added new route registrations
- `/package.json` - Added nodemailer dependency

### Frontend

#### New Context:
- `/context/NotificationContext.jsx` - Global notification state

#### New Components:
- `/components/NotificationBell.jsx` - Notification dropdown UI

#### New Pages:
- `/pages/ForumList.jsx` - Forum listing and search
- `/pages/ForumThread.jsx` - Individual forum thread view

#### Modified Files:
- `/App.jsx` - Added NotificationProvider, forum routes
- `/components/Navbar.jsx` - Added NotificationBell component

---

## 📊 Database Schema

### Notification Schema
```javascript
{
  user: ObjectId,
  type: enum['exam_reminder', 'result_published', etc.],
  title: String,
  message: String,
  relatedExam: ObjectId (optional),
  relatedResult: ObjectId (optional),
  relatedForum: ObjectId (optional),
  isRead: Boolean,
  isSent: Boolean,
  emailSent: Boolean,
  smsSent: Boolean,
  timestamps: true
}
```

### Forum Schema
```javascript
{
  title: String,
  content: String,
  subject: String,
  tags: [String],
  author: ObjectId,
  replies: [{
    user: ObjectId,
    content: String,
    likes: [ObjectId],
    isBestAnswer: Boolean
  }],
  likes: [ObjectId],
  views: Number,
  isPinned: Boolean,
  isClosed: Boolean,
  isSolved: Boolean,
  timestamps: true
}
```

### Study Group Schema
```javascript
{
  name: String,
  description: String,
  subject: String,
  creator: ObjectId,
  members: [{
    user: ObjectId,
    role: enum['admin', 'moderator', 'member']
  }],
  messages: [{
    user: ObjectId,
    content: String,
    type: enum['text', 'file', 'link']
  }],
  sharedNotes: [{
    title: String,
    fileUrl: String,
    uploadedBy: ObjectId
  }],
  isPrivate: Boolean,
  maxMembers: Number,
  timestamps: true
}
```

---

## 🔌 API Endpoints

### Notifications
```
GET    /api/notifications              - Get user notifications
GET    /api/notifications/unread-count - Get unread count
PUT    /api/notifications/:id/read     - Mark as read
PUT    /api/notifications/mark-all-read - Mark all as read
DELETE /api/notifications/:id          - Delete notification
POST   /api/notifications/test         - Test notification (dev only)
```

### Forums
```
GET    /api/forums                     - Get all forums (with filters)
GET    /api/forums/:id                 - Get single forum thread
POST   /api/forums                     - Create forum post
POST   /api/forums/:id/reply           - Add reply
POST   /api/forums/:id/like            - Like/unlike post
POST   /api/forums/:forumId/reply/:replyId/like - Like reply
PUT    /api/forums/:forumId/reply/:replyId/best-answer - Mark best answer
DELETE /api/forums/:id                 - Delete forum (author only)
GET    /api/forums/subjects/list       - Get unique subjects
```

### Study Groups
```
GET    /api/study-groups               - Get all/my groups
GET    /api/study-groups/:id           - Get single group
POST   /api/study-groups               - Create group
POST   /api/study-groups/:id/join      - Join group
POST   /api/study-groups/:id/leave     - Leave group
POST   /api/study-groups/:id/message   - Send message
POST   /api/study-groups/:id/invite    - Invite user (admin/mod)
DELETE /api/study-groups/:id           - Delete group (creator)
```

### Doubts
```
GET    /api/doubts                     - Get all doubts (with filters)
GET    /api/doubts/:id                 - Get single doubt
POST   /api/doubts                     - Create doubt
POST   /api/doubts/:id/answer          - Add answer
POST   /api/doubts/:doubtId/answer/:answerId/upvote - Upvote answer
POST   /api/doubts/:doubtId/answer/:answerId/downvote - Downvote answer
PUT    /api/doubts/:doubtId/answer/:answerId/best-answer - Mark best
DELETE /api/doubts/:id                 - Delete doubt (owner)
```

---

## ⚙️ Setup Instructions

### 1. Install Dependencies

#### Backend:
```bash
cd mcq-quiz/backend
npm install
```

#### Frontend:
```bash
cd mcq-quiz/frontend
npm install
```

### 2. Configure Email Service (Optional but Recommended)

See **[ENV-SETUP-GUIDE.md](./ENV-SETUP-GUIDE.md)** for detailed instructions.

Quick setup for Gmail:
1. Enable 2FA on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `backend/.env`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### 3. Start Servers

#### Backend:
```bash
cd mcq-quiz/backend
npm run dev
```

#### Frontend:
```bash
cd mcq-quiz/frontend
npm start
```

### 4. Test Notification System

Check backend console for:
- ✅ `Email service initialized successfully` (if SMTP configured)
- ⚠️ `Email service not configured - email notifications will be skipped` (if not configured)

---

## 🎨 UI Components

### Notification Bell
- **Location**: Top-right in Navbar
- **Badge**: Shows unread count
- **Dropdown**: Lists notifications with icons, timestamps
- **Actions**: Mark as read, delete, mark all as read

### Forum List
- **URL**: `/forums`
- **Features**: Search, subject filter, create new discussion
- **Display**: Card layout with metadata (replies, likes, views)

### Forum Thread
- **URL**: `/forums/:id`
- **Features**: Full post view, replies, like/unlike, mark best answer
- **Reply Form**: Text area for adding replies

### Study Groups (Future UI)
- **URL**: `/study-groups` (to be implemented)
- **Features**: Group list, join/create, chat interface

---

## 🔔 Notification Flow

1. **Event Occurs** (e.g., result published)
2. **Service Called** (`notificationService.notifyResultPublished()`)
3. **Database Entry Created** (Notification document)
4. **Email Sent** (if SMTP configured)
5. **Frontend Polls** (every 30 seconds)
6. **Unread Count Updates** (red badge on bell)
7. **User Clicks Bell** (sees notification in dropdown)
8. **User Clicks Notification** (marks as read, navigates to related page)

---

## 🚦 Feature Status

| Feature | Backend | Frontend | Tested |
|---------|---------|----------|--------|
| In-app notifications | ✅ | ✅ | ⏳ |
| Email notifications | ✅ | N/A | ⏳ |
| Forum list | ✅ | ✅ | ⏳ |
| Forum thread | ✅ | ✅ | ⏳ |
| Forum likes | ✅ | ✅ | ⏳ |
| Best answer | ✅ | ✅ | ⏳ |
| Study groups API | ✅ | ⏳ | ⏳ |
| Study group UI | ⏳ | ⏳ | ⏳ |
| Doubts API | ✅ | ⏳ | ⏳ |
| Doubts UI | ⏳ | ⏳ | ⏳ |
| SMS notifications | ⏳ | N/A | ⏳ |
| Real-time chat | ⏳ | ⏳ | ⏳ |

---

## 🔮 Future Enhancements

1. **Socket.io Integration**: Real-time notifications and chat
2. **Study Group UI**: Complete frontend for group management
3. **Doubts UI**: Full Q&A interface like Stack Overflow
4. **Rich Text Editor**: Markdown support for posts/replies
5. **File Upload**: Attach images/files to forum posts
6. **Notification Preferences**: User settings for email/SMS
7. **Admin Dashboard**: Moderate forums, manage groups
8. **Badges & Gamification**: Awards for helpful answers
9. **Weekly Digest Email**: Summary of activity
10. **Mobile Apps**: React Native apps with push notifications

---

## 🐛 Known Issues & Limitations

1. **Email Service**: Requires manual SMTP configuration
2. **Poll Interval**: 30-second delay for new notifications (will be fixed with Socket.io)
3. **Study Groups UI**: Backend ready, frontend pending
4. **Doubts UI**: Backend ready, frontend pending
5. **Email Templates**: Basic HTML, could be more beautiful
6. **No Rate Limiting**: API endpoints need rate limiting for production
7. **No Pagination**: Forum/notification lists load all records

---

## 📝 Development Notes

### Adding New Notification Types

1. Add enum value in `/models/Notification.js`:
   ```javascript
   type: {
     enum: [...existing, 'new_type']
   }
   ```

2. Create method in `/services/notificationService.js`:
   ```javascript
   async notifyNewType(userId, data) {
     await this.createNotification({
       userId,
       type: 'new_type',
       title: 'New Notification',
       message: 'Description',
       sendEmail: true
     });
   }
   ```

3. Add email template in `/services/emailService.js`:
   ```javascript
   async sendNewTypeEmail(user, data) {
     // HTML template
   }
   ```

4. Add icon in `/components/NotificationBell.jsx`:
   ```javascript
   case 'new_type':
     return '🆕';
   ```

### Best Practices

1. **Always use notificationService** instead of creating notifications directly
2. **Email templates should be responsive** and work in all email clients
3. **Test with real SMTP** before production deployment
4. **Use environment variables** for all credentials
5. **Add indexes** to models for frequently queried fields
6. **Implement pagination** for lists with many items
7. **Add loading states** to all async operations

---

## 📚 Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Password Setup](https://support.google.com/accounts/answer/185833)
- [Twilio SMS Guide](https://www.twilio.com/docs/sms/quickstart)
- [Socket.io Documentation](https://socket.io/docs/)
- [Mongoose Indexing](https://mongoosejs.com/docs/guide.html#indexes)

---

## 🤝 Contributing

When adding new features:
1. Follow existing code structure and patterns
2. Add comprehensive JSDoc comments
3. Update this README with new features
4. Test with real data before committing
5. Add to ENV-SETUP-GUIDE.md if new env vars needed

---

## 📞 Support

For questions or issues:
1. Check console logs for error messages
2. Verify `.env` configuration
3. Ensure all dependencies are installed
4. Test API endpoints with Postman/Thunder Client
5. Check MongoDB connection and indexes

---

## ✅ Verification Checklist

Before deployment, verify:
- [ ] Backend starts without errors
- [ ] Frontend compiles without warnings
- [ ] Notifications appear in bell icon
- [ ] Email service logs success/warning
- [ ] Forums list loads and displays correctly
- [ ] Can create forum posts
- [ ] Can reply to forums
- [ ] Likes work on posts and replies
- [ ] Notification count updates
- [ ] Mark as read works
- [ ] All routes are protected (require auth)
- [ ] Environment variables documented
- [ ] Git `.env` files not committed
- [ ] Production SMTP configured (SendGrid/Mailgun recommended)

---

**Version**: 1.0.0  
**Last Updated**: Today  
**Status**: ✅ Ready for Testing
