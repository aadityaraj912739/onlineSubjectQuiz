const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PreviousPaper = require('../models/PreviousPaper');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/previous-papers';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'paper-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

// @route   POST /api/previous-papers/upload
// @desc    Upload a previous year paper (Teacher only)
// @access  Private (Teacher)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            // Delete uploaded file if user is not a teacher
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({ message: 'Only teachers can upload previous papers' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF file' });
        }

        const { title, subject, year, country, state, college, branch, semester } = req.body;

        if (!title || !subject || !year || !country || !state || !college || !branch || !semester) {
            // Delete uploaded file if validation fails
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'All fields are required' });
        }

        const previousPaper = new PreviousPaper({
            title,
            subject,
            year,
            country,
            state,
            college,
            branch,
            semester,
            teacher: req.user.id,
            fileUrl: `/uploads/previous-papers/${req.file.filename}`,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });

        await previousPaper.save();

        const populatedPaper = await PreviousPaper.findById(previousPaper._id)
            .populate('teacher', 'name email');

        res.status(201).json({
            message: 'Previous paper uploaded successfully',
            paper: populatedPaper
        });
    } catch (error) {
        console.error('Error uploading previous paper:', error);
        // Delete uploaded file if error occurs
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server error while uploading previous paper' });
    }
});

// @route   GET /api/previous-papers
// @desc    Get all previous papers with optional filters
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { country, state, college, branch, semester, subject, year, search } = req.query;

        // Build filter query
        const filter = { isActive: true };

        if (country) filter.country = country;
        if (state) filter.state = state;
        if (college) filter.college = college;
        if (branch) filter.branch = branch;
        if (semester) filter.semester = semester;
        if (subject) filter.subject = subject;
        if (year) filter.year = year;

        // Search in title and subject
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }

        const papers = await PreviousPaper.find(filter)
            .populate('teacher', 'name email department')
            .sort({ createdAt: -1 });

        res.json(papers);
    } catch (error) {
        console.error('Error fetching previous papers:', error);
        res.status(500).json({ message: 'Server error while fetching previous papers' });
    }
});

// @route   GET /api/previous-papers/teacher
// @desc    Get previous papers uploaded by logged-in teacher
// @access  Private (Teacher)
router.get('/teacher', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Only teachers can access this route' });
        }

        const papers = await PreviousPaper.find({ teacher: req.user.id })
            .sort({ createdAt: -1 });

        res.json(papers);
    } catch (error) {
        console.error('Error fetching teacher papers:', error);
        res.status(500).json({ message: 'Server error while fetching papers' });
    }
});

// @route   GET /api/previous-papers/filters
// @desc    Get unique filter values for dropdowns
// @access  Private
router.get('/filters', auth, async (req, res) => {
    try {
        const countries = await PreviousPaper.distinct('country', { isActive: true });
        const states = await PreviousPaper.distinct('state', { isActive: true });
        const colleges = await PreviousPaper.distinct('college', { isActive: true });
        const branches = await PreviousPaper.distinct('branch', { isActive: true });
        const semesters = await PreviousPaper.distinct('semester', { isActive: true });
        const subjects = await PreviousPaper.distinct('subject', { isActive: true });
        const years = await PreviousPaper.distinct('year', { isActive: true });

        res.json({
            countries: countries.sort(),
            states: states.sort(),
            colleges: colleges.sort(),
            branches: branches.sort(),
            semesters: semesters.sort(),
            subjects: subjects.sort(),
            years: years.sort()
        });
    } catch (error) {
        console.error('Error fetching filters:', error);
        res.status(500).json({ message: 'Server error while fetching filters' });
    }
});

// @route   GET /api/previous-papers/:id
// @desc    Get a single previous paper by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const paper = await PreviousPaper.findById(req.params.id)
            .populate('teacher', 'name email department');

        if (!paper) {
            return res.status(404).json({ message: 'Previous paper not found' });
        }

        res.json(paper);
    } catch (error) {
        console.error('Error fetching previous paper:', error);
        res.status(500).json({ message: 'Server error while fetching previous paper' });
    }
});

// @route   PUT /api/previous-papers/:id
// @desc    Update a previous paper (Teacher only)
// @access  Private (Teacher)
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Only teachers can update previous papers' });
        }

        const paper = await PreviousPaper.findById(req.params.id);

        if (!paper) {
            return res.status(404).json({ message: 'Previous paper not found' });
        }

        // Check if the teacher owns this paper
        if (paper.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only update your own papers' });
        }

        const { title, subject, year, country, state, college, branch, semester } = req.body;

        if (title) paper.title = title;
        if (subject) paper.subject = subject;
        if (year) paper.year = year;
        if (country) paper.country = country;
        if (state) paper.state = state;
        if (college) paper.college = college;
        if (branch) paper.branch = branch;
        if (semester) paper.semester = semester;

        await paper.save();

        const updatedPaper = await PreviousPaper.findById(paper._id)
            .populate('teacher', 'name email department');

        res.json({
            message: 'Previous paper updated successfully',
            paper: updatedPaper
        });
    } catch (error) {
        console.error('Error updating previous paper:', error);
        res.status(500).json({ message: 'Server error while updating previous paper' });
    }
});

// @route   DELETE /api/previous-papers/:id
// @desc    Delete a previous paper (Teacher only)
// @access  Private (Teacher)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Only teachers can delete previous papers' });
        }

        const paper = await PreviousPaper.findById(req.params.id);

        if (!paper) {
            return res.status(404).json({ message: 'Previous paper not found' });
        }

        // Check if the teacher owns this paper
        if (paper.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own papers' });
        }

        // Delete the file from filesystem
        const filePath = path.join(__dirname, '..', paper.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await PreviousPaper.findByIdAndDelete(req.params.id);

        res.json({ message: 'Previous paper deleted successfully' });
    } catch (error) {
        console.error('Error deleting previous paper:', error);
        res.status(500).json({ message: 'Server error while deleting previous paper' });
    }
});

// @route   PUT /api/previous-papers/:id/download
// @desc    Increment download count
// @access  Private
router.put('/:id/download', auth, async (req, res) => {
    try {
        const paper = await PreviousPaper.findByIdAndUpdate(
            req.params.id,
            { $inc: { downloadCount: 1 } },
            { new: true }
        );

        if (!paper) {
            return res.status(404).json({ message: 'Previous paper not found' });
        }

        res.json({ message: 'Download count updated' });
    } catch (error) {
        console.error('Error updating download count:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/previous-papers/download/:id
// @desc    Download a previous paper file with validation
// @access  Private
router.get('/download/:id', auth, async (req, res) => {
    try {
        const paper = await PreviousPaper.findById(req.params.id);

        if (!paper) {
            return res.status(404).json({ message: 'Previous paper not found in database' });
        }

        const filePath = path.join(__dirname, '..', paper.fileUrl);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return res.status(404).json({ 
                message: 'File not found on server. This may occur after server restarts on cloud platforms.',
                suggestion: 'Please contact the teacher to re-upload the file.'
            });
        }

        // Increment download count
        paper.downloadCount += 1;
        await paper.save();

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${paper.fileName}"`);

        // Send file
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Server error while downloading file' });
    }
});

module.exports = router;
