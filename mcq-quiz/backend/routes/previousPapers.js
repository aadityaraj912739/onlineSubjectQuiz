const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const PreviousPaper = require('../models/PreviousPaper');
const { uploadPreviousPaper, deleteFromCloudinary, extractPublicId } = require('../config/cloudinary');

// @route   POST /api/previous-papers/upload
// @desc    Upload a previous year paper (Teacher only)
// @access  Private (Teacher)
router.post('/upload', auth, uploadPreviousPaper.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            // Delete uploaded file from Cloudinary if user is not a teacher
            if (req.file && req.file.public_id) {
                await deleteFromCloudinary(req.file.public_id, 'raw');
            }
            return res.status(403).json({ message: 'Only teachers can upload previous papers' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF file' });
        }

        const { title, subject, year, country, state, college, branch, semester } = req.body;

        if (!title || !subject || !year || !country || !state || !college || !branch || !semester) {
            // Delete uploaded file from Cloudinary if validation fails
            if (req.file.public_id) {
                await deleteFromCloudinary(req.file.public_id, 'raw');
            }
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
            fileUrl: req.file.path, // Cloudinary URL
            fileName: req.file.originalname,
            fileSize: req.file.size,
            cloudinaryPublicId: req.file.public_id // Store for later deletion
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
        // Delete uploaded file from Cloudinary if error occurs
        if (req.file && req.file.public_id) {
            try {
                await deleteFromCloudinary(req.file.public_id, 'raw');
            } catch (deleteError) {
                console.error('Error deleting file from Cloudinary:', deleteError);
            }
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

        // Delete the file from Cloudinary
        if (paper.cloudinaryPublicId) {
            try {
                await deleteFromCloudinary(paper.cloudinaryPublicId, 'raw');
            } catch (deleteError) {
                console.error('Error deleting from Cloudinary:', deleteError);
                // Continue with database deletion even if Cloudinary deletion fails
            }
        } else if (paper.fileUrl) {
            // Try to extract public_id from URL if not stored
            const publicId = extractPublicId(paper.fileUrl);
            if (publicId) {
                try {
                    await deleteFromCloudinary(publicId, 'raw');
                } catch (deleteError) {
                    console.error('Error deleting from Cloudinary using extracted ID:', deleteError);
                }
            }
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

        if (!paper.fileUrl) {
            return res.status(404).json({ 
                message: 'File URL not found for this paper',
                fileNotAvailable: true
            });
        }

        // Increment download count
        paper.downloadCount += 1;
        await paper.save();

        // Redirect to Cloudinary URL for direct download
        // Cloudinary URLs are permanent and always accessible
        res.redirect(paper.fileUrl);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ 
            message: 'Server error while downloading file',
            error: error.message 
        });
    }
});

module.exports = router;
