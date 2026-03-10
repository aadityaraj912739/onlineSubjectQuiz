const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage configuration for Previous Papers (PDF only)
const previousPapersStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'previous-papers',
        allowed_formats: ['pdf'],
        resource_type: 'raw', // For non-image files like PDF
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `paper-${uniqueSuffix}`;
        }
    }
});

// Storage configuration for Study Materials (PDF, images, videos, documents)
const studyMaterialsStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const ext = file.originalname.split('.').pop().toLowerCase();
        
        // Determine resource type based on file extension
        let resourceType = 'raw'; // default for documents
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
            resourceType = 'image';
        } else if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
            resourceType = 'video';
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        
        return {
            folder: 'study-materials',
            allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'xlsx', 'xls'],
            resource_type: resourceType,
            public_id: `material-${uniqueSuffix}`
        };
    }
});

// Storage configuration for Profile Pictures (Images only)
const profilePictureStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'profile-pictures',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        resource_type: 'image',
        transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `user-${req.user.id}-${uniqueSuffix}`;
        }
    }
});

// File filter for Previous Papers
const previousPapersFileFilter = (req, file, cb) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'));
    }
};

// File filter for Study Materials
const studyMaterialsFileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|txt|jpg|jpeg|png|gif|mp4|mov|avi|xlsx|xls/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());

    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('File type not allowed! Allowed types: PDF, DOC, DOCX, PPT, PPTX, TXT, images, videos, Excel'));
    }
};

// File filter for Profile Pictures
const profilePictureFileFilter = (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (JPG, JPEG, PNG, GIF, WEBP) are allowed!'));
    }
};

// Multer upload configurations
const uploadPreviousPaper = multer({
    storage: previousPapersStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: previousPapersFileFilter
});

const uploadStudyMaterial = multer({
    storage: studyMaterialsStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos and larger files
    fileFilter: studyMaterialsFileFilter
});

const uploadProfilePicture = multer({
    storage: profilePictureStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for profile pictures
    fileFilter: profilePictureFileFilter
});

// Storage configuration for Forum Images
const forumImageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'forum-images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        resource_type: 'image',
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `forum-${uniqueSuffix}`;
        }
    }
});

// File filter for Forum Images
const forumImageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (JPG, JPEG, PNG, GIF, WEBP) are allowed!'));
    }
};

const uploadForumImage = multer({
    storage: forumImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: forumImageFileFilter
});

// Helper function to delete a file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};

// Helper function to extract public_id from Cloudinary URL
const extractPublicId = (url) => {
    try {
        // URL format: https://res.cloudinary.com/cloud_name/resource_type/upload/v1234567890/folder/public_id.ext
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1) {
            // Get everything after 'upload/v1234567890/'
            const pathParts = parts.slice(uploadIndex + 2);
            const fullPath = pathParts.join('/');
            // Remove extension
            return fullPath.substring(0, fullPath.lastIndexOf('.'));
        }
        return null;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

module.exports = {
    cloudinary,
    uploadPreviousPaper,
    uploadStudyMaterial,
    uploadProfilePicture,
    uploadForumImage,
    deleteFromCloudinary,
    extractPublicId
};
