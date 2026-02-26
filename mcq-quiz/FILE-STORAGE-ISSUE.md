# File Storage Issue & Solutions

## Problem Description

When deploying the application to cloud platforms (Render, Vercel, Heroku, etc.), uploaded files stored in the local `uploads/` directory may be **deleted after server restarts**. This is because:

1. **Ephemeral File Systems**: Cloud platforms use ephemeral (temporary) file systems that reset on each deployment or restart
2. **Container-Based Deployments**: Docker containers don't persist local files between restarts
3. **Scaling**: When your app scales across multiple instances, files uploaded to one instance aren't available on others

## Current Behavior

- **Previous Papers** and **Study Materials** can be uploaded successfully
- After a server restart or redeployment, the files are lost
- Users see error: "File no longer available on server. Please contact the teacher to re-upload."

## Solutions

### Option 1: Cloud Storage (Recommended for Production)

Integrate a cloud storage service to persist files permanently:

#### A. AWS S3
- Most popular and reliable
- Cost: ~$0.023 per GB/month
- Setup guide: `mcq-quiz/backend/CLOUD-STORAGE-GUIDE.md`

#### B. Cloudinary
- Great for PDFs and documents
- Free tier: 25GB storage
- Easy integration with Node.js

#### C. Google Cloud Storage
- Similar to S3
- Good if already using Google Cloud

#### D. MongoDB GridFS
- Store files directly in MongoDB
- Good for medium-sized files
- No additional service needed

### Option 2: External Link Storage (Current Alternative)

Instead of uploading files, teachers can:
1. Upload files to Google Drive, Dropbox, or OneDrive
2. Get a public/shareable link
3. Paste the link in the "External Link" field
4. Files remain accessible permanently

### Option 3: Local Development Only

For local development/testing:
- Files are stored in `uploads/` directory
- Works fine until server restarts
- Not suitable for production

## Recommended Implementation

For production deployment, implement **AWS S3 or Cloudinary**:

### Quick Start with Cloudinary

1. **Install package**:
   ```bash
   cd mcq-quiz/backend
   npm install cloudinary multer-storage-cloudinary
   ```

2. **Add to `.env`**:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Update multer configuration** in `routes/previousPapers.js` and `routes/studyMaterials.js`

4. **Files will persist permanently** across all server restarts

## User Guidance

### For Teachers:
- **Be aware**: Uploaded files may be lost after server maintenance
- **Best practice**: Also keep a backup of important files
- **Alternative**: Use external links (Google Drive, Dropbox) for permanent storage

### For Students:
- If you see "File no longer available" error, contact your teacher
- The file needs to be re-uploaded by the teacher

## Status

✅ **Error handling improved**: Clear messages when files are unavailable
✅ **Logging added**: Better debugging for file issues
⚠️ **Cloud storage**: Not yet implemented (recommended for production)

## Next Steps

1. Choose a cloud storage provider
2. Follow integration guide from `CLOUD-STORAGE-GUIDE.md`
3. Update multer configuration to use cloud storage
4. Test file upload/download functionality
5. Deploy updated version
