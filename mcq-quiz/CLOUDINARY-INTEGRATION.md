# Cloudinary Integration Guide

## Overview
The application has been successfully integrated with Cloudinary for permanent cloud storage of files. All files (PDFs, images, videos, documents) uploaded by teachers for study materials and previous papers are now stored on Cloudinary instead of the local filesystem.

## What Changed

### 1. **New Configuration File**
   - **File**: `backend/config/cloudinary.js`
   - Handles Cloudinary setup and provides upload configurations for:
     - **Previous Papers**: PDF files only
     - **Study Materials**: PDFs, images, videos, DOC, PPT, Excel files, etc.
   - Provides helper functions for file deletion and public_id extraction

### 2. **Updated Routes**
   
   #### Previous Papers (`backend/routes/previousPapers.js`)
   - Upload endpoint now stores files directly to Cloudinary
   - File URLs are permanent Cloudinary URLs
   - Delete endpoint removes files from Cloudinary
   - Download endpoint redirects to Cloudinary URL for direct download
   
   #### Study Materials (`backend/routes/studyMaterials.js`)
   - Upload endpoint stores files to Cloudinary
   - Supports multiple file types: images, videos, documents
   - Delete endpoint removes files from Cloudinary
   - Returns Cloudinary URL, file info, and public_id

### 3. **Updated Database Models**
   
   #### PreviousPaper Model
   - Added `cloudinaryPublicId` field to store the Cloudinary public ID
   - This allows easy deletion of files from Cloudinary
   
   #### StudyMaterial Model
   - Added `cloudinaryPublicId` field
   - Supports tracking of different resource types (images, videos, documents)

### 4. **Environment Variables**
   - Created `.env.example` with Cloudinary credentials
   - Added three new environment variables:
     - `CLOUDINARY_CLOUD_NAME=your_cloud_name`
     - `CLOUDINARY_API_KEY=your_api_key`
     - `CLOUDINARY_API_SECRET=your_api_secret`

## Benefits

✅ **Permanent Storage**: Files are stored permanently on Cloudinary, not affected by server restarts
✅ **Scalable**: No need to manage local filesystem storage
✅ **CDN Delivery**: Files are served through Cloudinary's global CDN for fast access
✅ **Secure**: Automatic HTTPS for all file URLs
✅ **Automatic Optimization**: Images and videos are automatically optimized
✅ **Large File Support**: Increased file size limit to 50MB for videos and large documents

## File Upload Limits

- **Previous Papers**: 10MB (PDF only)
- **Study Materials**: 50MB (all supported file types)

## Supported File Types

### Previous Papers
- PDF only

### Study Materials
- Documents: PDF, DOC, DOCX, PPT, PPTX, TXT, XLS, XLSX
- Images: JPG, JPEG, PNG, GIF
- Videos: MP4, MOV, AVI

## Setup Instructions

### 1. Add Environment Variables
If you don't have a `.env` file in `backend/` directory, create one and add:

```env
# Get these credentials from your Cloudinary dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 2. Install Dependencies (Already Done)
The following packages have been installed:
- `cloudinary`
- `multer-storage-cloudinary`

### 3. Restart Server
Restart your backend server to apply the changes:
```bash
cd mcq-quiz/backend
npm run dev
```

## How It Works

### For Teachers (Upload)

1. **Previous Papers**:
   ```javascript
   POST /api/previous-papers/upload
   - Upload PDF file
   - File is automatically stored on Cloudinary
   - Returns paper details with permanent Cloudinary URL
   ```

2. **Study Materials**:
   ```javascript
   POST /api/study-materials/upload
   - Upload any supported file type
   - File is automatically stored on Cloudinary
   - Returns file URL and cloudinaryPublicId
   
   POST /api/study-materials
   - Create study material with the uploaded file URL
   - Include cloudinaryPublicId in the request body
   ```

### For Students (Download)

1. **Previous Papers**:
   ```javascript
   GET /api/previous-papers/download/:id
   - Redirects to permanent Cloudinary URL
   - File can be viewed or downloaded directly
   - Download count is automatically incremented
   ```

2. **Study Materials**:
   - Use the `fileUrl` from the material object
   - Direct link to Cloudinary CDN
   - No server processing required

### File Deletion

When a teacher deletes a paper or material:
1. File is removed from Cloudinary
2. Database record is deleted
3. No orphaned files remain

## Cloudinary Folder Structure

```
Cloudinary Root
├── previous-papers/
│   └── paper-{timestamp}-{random}.pdf
└── study-materials/
    ├── material-{timestamp}-{random}.pdf
    ├── material-{timestamp}-{random}.jpg
    └── material-{timestamp}-{random}.mp4
```

## Migration Notes

**Existing Files**: 
- Old files stored locally in `uploads/` folder will continue to work
- New uploads will go to Cloudinary
- Old files can be manually migrated if needed (contact developer)

## Troubleshooting

### Upload Fails
- Check if Cloudinary credentials are correct in `.env`
- Verify file size doesn't exceed limits
- Check file type is supported

### Download Issues
- Cloudinary URLs are always accessible
- No server restarts affect file availability
- Check if file was successfully uploaded to Cloudinary

### Delete Issues
- If Cloudinary deletion fails, database record is still deleted
- Orphaned files on Cloudinary can be manually cleaned up from dashboard

## Cloudinary Dashboard

Access your Cloudinary dashboard at:
https://cloudinary.com/console

Login credentials:
- Cloud name: `dqg3rns07`

You can view, manage, and download all uploaded files from the dashboard.

## API Response Examples

### Upload Previous Paper
```json
{
  "message": "Previous paper uploaded successfully",
  "paper": {
    "_id": "...",
    "title": "Sample Paper",
    "subject": "Mathematics",
    "fileUrl": "https://res.cloudinary.com/dqg3rns07/raw/upload/v1234567890/previous-papers/paper-1234567890.pdf",
    "fileName": "math-paper.pdf",
    "fileSize": 1024000,
    "cloudinaryPublicId": "previous-papers/paper-1234567890",
    "teacher": {...},
    "createdAt": "..."
  }
}
```

### Upload Study Material File
```json
{
  "message": "File uploaded successfully",
  "fileUrl": "https://res.cloudinary.com/dqg3rns07/image/upload/v1234567890/study-materials/material-1234567890.jpg",
  "fileName": "diagram.jpg",
  "fileSize": 512000,
  "cloudinaryPublicId": "study-materials/material-1234567890"
}
```

## Next Steps

1. ✅ Test file uploads for previous papers
2. ✅ Test file uploads for study materials
3. ✅ Test file downloads
4. ✅ Test file deletions
5. ✅ Verify files persist after server restart

All setup is complete! Your application now uses permanent cloud storage for all uploaded files.
