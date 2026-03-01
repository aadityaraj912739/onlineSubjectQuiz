const express = require('express');
const StudyMaterial = require('../models/StudyMaterial');
const { auth, isTeacher, isStudent } = require('../middleware/auth');
const { uploadStudyMaterial, deleteFromCloudinary, extractPublicId } = require('../config/cloudinary');

const router = express.Router();

// @route   POST /api/study-materials/upload
// @desc    Upload a file
// @access  Private (Teacher only)
router.post('/upload', auth, isTeacher, uploadStudyMaterial.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        res.json({
            message: 'File uploaded successfully',
            fileUrl: req.file.path, // Cloudinary URL
            fileName: req.file.originalname,
            fileSize: req.file.size,
            cloudinaryPublicId: req.file.public_id
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error while uploading file' });
    }
});

// @route   POST /api/study-materials
// @desc    Create new study material (Teacher only)
// @access  Private
router.post('/', auth, isTeacher, async (req, res) => {
    try {
        const { title, description, subject, type, fileUrl, content, tags, cloudinaryPublicId } = req.body;

        if (!title || !subject) {
            return res.status(400).json({ message: 'Title and subject are required' });
        }

        const studyMaterial = new StudyMaterial({
            title,
            description,
            subject,
            type: type || 'notes',
            teacher: req.user._id,
            fileUrl,
            content,
            tags: tags || [],
            cloudinaryPublicId
        });

        await studyMaterial.save();

        const populatedMaterial = await StudyMaterial.findById(studyMaterial._id)
            .populate('teacher', 'name email');

        res.status(201).json({
            message: 'Study material created successfully',
            material: populatedMaterial
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating study material' });
    }
});

// @route   GET /api/study-materials
// @desc    Get all study materials (Students can view)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { subject, type } = req.query;
        
        const query = { isActive: true };
        if (subject) query.subject = subject;
        if (type) query.type = type;

        const materials = await StudyMaterial.find(query)
            .populate('teacher', 'name email')
            .sort({ createdAt: -1 });

        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching study materials' });
    }
});

// @route   GET /api/study-materials/teacher
// @desc    Get study materials created by logged-in teacher
// @access  Private (Teacher only)
router.get('/teacher', auth, isTeacher, async (req, res) => {
    try {
        const materials = await StudyMaterial.find({ teacher: req.user._id })
            .sort({ createdAt: -1 });

        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching materials' });
    }
});

// @route   GET /api/study-materials/:id
// @desc    Get single study material
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id)
            .populate('teacher', 'name email');

        if (!material) {
            return res.status(404).json({ message: 'Study material not found' });
        }

        // Increment view count
        material.viewCount += 1;
        await material.save();

        res.json(material);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching material' });
    }
});

// @route   PUT /api/study-materials/:id
// @desc    Update study material
// @access  Private (Teacher only)
router.put('/:id', auth, isTeacher, async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);

        if (!material) {
            return res.status(404).json({ message: 'Study material not found' });
        }

        // Check if this teacher owns the material
        if (material.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this material' });
        }

        const { title, description, subject, type, fileUrl, content, tags, isActive } = req.body;

        if (title) material.title = title;
        if (description !== undefined) material.description = description;
        if (subject) material.subject = subject;
        if (type) material.type = type;
        if (fileUrl !== undefined) material.fileUrl = fileUrl;
        if (content !== undefined) material.content = content;
        if (tags) material.tags = tags;
        if (isActive !== undefined) material.isActive = isActive;

        await material.save();

        const updatedMaterial = await StudyMaterial.findById(material._id)
            .populate('teacher', 'name email');

        res.json({
            message: 'Study material updated successfully',
            material: updatedMaterial
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating material' });
    }
});

// @route   DELETE /api/study-materials/:id
// @desc    Delete study material
// @access  Private (Teacher only)
router.delete('/:id', auth, isTeacher, async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);

        if (!material) {
            return res.status(404).json({ message: 'Study material not found' });
        }

        // Check if this teacher owns the material
        if (material.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this material' });
        }

        // Delete file from Cloudinary if exists
        if (material.cloudinaryPublicId) {
            try {
                // Determine resource type from public_id or fileUrl
                let resourceType = 'raw';
                if (material.fileUrl) {
                    if (material.fileUrl.includes('/image/')) {
                        resourceType = 'image';
                    } else if (material.fileUrl.includes('/video/')) {
                        resourceType = 'video';
                    }
                }
                await deleteFromCloudinary(material.cloudinaryPublicId, resourceType);
            } catch (deleteError) {
                console.error('Error deleting from Cloudinary:', deleteError);
                // Continue with database deletion even if Cloudinary deletion fails
            }
        } else if (material.fileUrl) {
            // Try to extract public_id from URL if not stored
            const publicId = extractPublicId(material.fileUrl);
            if (publicId) {
                try {
                    let resourceType = 'raw';
                    if (material.fileUrl.includes('/image/')) {
                        resourceType = 'image';
                    } else if (material.fileUrl.includes('/video/')) {
                        resourceType = 'video';
                    }
                    await deleteFromCloudinary(publicId, resourceType);
                } catch (deleteError) {
                    console.error('Error deleting from Cloudinary using extracted ID:', deleteError);
                }
            }
        }

        await StudyMaterial.findByIdAndDelete(req.params.id);

        res.json({ message: 'Study material deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting material' });
    }
});

// @route   GET /api/study-materials/subjects/list
// @desc    Get unique subjects list
// @access  Private
router.get('/subjects/list', auth, async (req, res) => {
    try {
        const subjects = await StudyMaterial.distinct('subject', { isActive: true });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching subjects' });
    }
});

// Helper function to transform Cloudinary URL to force download
function getCloudinaryDownloadUrl(cloudinaryUrl, fileName) {
    try {
        // Check if it's a Cloudinary URL
        if (!cloudinaryUrl.includes('cloudinary.com')) {
            return cloudinaryUrl;
        }

        // Split URL at /upload/
        const parts = cloudinaryUrl.split('/upload/');
        if (parts.length !== 2) {
            return cloudinaryUrl; // Return original if format is unexpected
        }

        // Get file extension from filename
        const fileExt = fileName.split('.').pop().toLowerCase();
        
        // Extract public_id path (everything after upload/)
        let publicIdPath = parts[1];
        
        // Check if URL already has extension, if not add it
        if (!publicIdPath.endsWith(`.${fileExt}`)) {
            publicIdPath = `${publicIdPath}.${fileExt}`;
        }
        
        // Add fl_attachment flag (without custom filename to avoid encoding issues)
        // Cloudinary will use the original filename from the upload
        const downloadUrl = `${parts[0]}/upload/fl_attachment/${publicIdPath}`;
        
        return downloadUrl;
    } catch (error) {
        console.error('Error transforming Cloudinary URL:', error);
        return cloudinaryUrl; // Return original on error
    }
}

// @route   GET /api/study-materials/download/:id
// @desc    Proxy download for study material files
// @access  Private
router.get('/download/:id', auth, async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);

        if (!material) {
            return res.status(404).json({ message: 'Study material not found' });
        }

        if (!material.fileUrl) {
            return res.status(404).json({ 
                message: 'No file attached to this material',
                fileNotAvailable: true
            });
        }

        // Check if it's a Cloudinary URL
        if (material.fileUrl.includes('cloudinary.com')) {
            // For Cloudinary files, proxy the download through our server
            const axios = require('axios');
            
            try {
                // Fetch file from Cloudinary
                const response = await axios({
                    method: 'get',
                    url: material.fileUrl,
                    responseType: 'stream'
                });

                // Extract filename from title or use default
                const fileName = material.title ? `${material.title.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf` : 'study_material.pdf';

                // Set headers to force download with filename
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
                
                // Pipe the file stream to response
                response.data.pipe(res);
            } catch (cloudinaryError) {
                console.error('Error fetching from Cloudinary:', cloudinaryError.message);
                return res.status(404).json({ 
                    message: 'File not found on cloud storage',
                    fileNotAvailable: true
                });
            }
        } else if (material.fileUrl.startsWith('/uploads/')) {
            // Old local files - no longer available
            return res.status(404).json({ 
                message: 'File was uploaded before cloud storage migration and is no longer available.',
                fileNotAvailable: true,
                requiresReupload: true
            });
        } else {
            // External URL or unknown format
            const axios = require('axios');
            try {
                const response = await axios({
                    method: 'get',
                    url: material.fileUrl,
                    responseType: 'stream'
                });

                const fileName = material.title || 'study_material';
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
                response.data.pipe(res);
            } catch (error) {
                return res.status(404).json({ 
                    message: 'File not found',
                    fileNotAvailable: true
                });
            }
        }
    } catch (error) {
        console.error('Error downloading study material:', error);
        res.status(500).json({ 
            message: 'Server error while downloading file',
            error: error.message 
        });
    }
});

module.exports = router;
