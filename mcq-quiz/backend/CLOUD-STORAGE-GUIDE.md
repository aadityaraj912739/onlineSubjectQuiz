# Cloud Storage Guide

## Important: File Upload Limitation on Cloud Platforms

### The Problem
On cloud platforms like **Render**, **Heroku**, **Vercel**, etc., the filesystem is **ephemeral**, meaning:
- Uploaded files are stored temporarily
- Files are **lost when the server restarts** or redeploys
- Not suitable for permanent file storage

### Current Behavior
- Files uploaded to `/uploads/previous-papers/` directory
- Works fine on **localhost**
- **Fails on production** (Render) after server restart

### Solution: Use Cloud Storage

You need to integrate a cloud storage service for production. Popular options:

#### 1. **Cloudinary** (Recommended - Easy & Free tier)
```bash
npm install cloudinary multer-storage-cloudinary
```

#### 2. **AWS S3**
```bash
npm install aws-sdk multer-s3
```

#### 3. **Google Cloud Storage**
```bash
npm install @google-cloud/storage multer-storage-google-cloud
```

### Implementation Steps (Cloudinary Example)

1. **Sign up at** https://cloudinary.com (Free tier: 25GB storage, 25GB bandwidth/month)

2. **Install packages**:
```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

3. **Add to `.env`**:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. **Update `routes/previousPapers.js`**:
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Update multer storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'previous-papers',
        format: async (req, file) => 'pdf',
        public_id: (req, file) => 'paper-' + Date.now(),
        resource_type: 'raw' // Important for PDF files
    }
});
```

5. **Update file URL in database**:
- Instead of `/uploads/previous-papers/filename.pdf`
- Save Cloudinary URL: `https://res.cloudinary.com/...`

### Quick Fix (Temporary)
For now, you can:
1. Re-upload files after each deployment
2. Keep a backup of uploaded files locally
3. Use the new `/api/previous-papers/download/:id` route which provides better error messages

### Testing
After implementing cloud storage:
- Upload a file
- Restart your server
- File should still be accessible ✅
