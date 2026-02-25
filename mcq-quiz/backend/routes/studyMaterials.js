const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const StudyMaterial = require('../models/StudyMaterial');
const { auth, isTeacher, isStudent } = require('../middleware/auth');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow pdf, doc, docx, ppt, pptx, txt, jpg, png, xlsx, xls
    const allowedTypes = /pdf|doc|docx|ppt|pptx|txt|jpg|jpeg|png|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX, PPT, PPTX, TXT, Excel (XLS, XLSX) and image files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// @route   POST /api/study-materials/upload
// @desc    Upload a file
// @access  Private (Teacher only)
router.post('/upload', auth, isTeacher, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        
        res.json({
            message: 'File uploaded successfully',
            fileUrl: fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size
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
        const { title, description, subject, type, fileUrl, content, tags } = req.body;

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
            tags: tags || []
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

module.exports = router;
