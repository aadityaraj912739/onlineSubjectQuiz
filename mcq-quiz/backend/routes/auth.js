const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { uploadProfilePicture, deleteFromCloudinary } = require('../config/cloudinary');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, department, rollNumber, class: userClass, semester, linkedin, leetcode, github } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create user object
        const userData = { name, email, password, role, linkedin, leetcode, github };

        // Add role-specific fields
        if (role === 'teacher') {
            userData.department = department;
        } else if (role === 'student') {
            userData.rollNumber = rollNumber;
            userData.class = userClass;
            userData.semester = semester;
        }

        // Create new user
        const user = new User(userData);
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                rollNumber: user.rollNumber,
                class: user.class,
                linkedin: user.linkedin,
                leetcode: user.leetcode,
                github: user.github,
                country: user.country,
                state: user.state,
                college: user.college,
                branch: user.branch,
                semester: user.semester
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                rollNumber: user.rollNumber,
                class: user.class,
                linkedin: user.linkedin,
                leetcode: user.leetcode,
                github: user.github,
                country: user.country,
                state: user.state,
                college: user.college,
                branch: user.branch,
                semester: user.semester
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                department: req.user.department,
                rollNumber: req.user.rollNumber,
                class: req.user.class,
                profileImage: req.user.profileImage,
                linkedin: req.user.linkedin,
                leetcode: req.user.leetcode,
                github: req.user.github,
                country: req.user.country,
                state: req.user.state,
                college: req.user.college,
                branch: req.user.branch,
                semester: req.user.semester
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, department, rollNumber, class: userClass, linkedin, leetcode, github, country, state, college, branch, semester } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;

        // Social links (applicable to both roles)
        user.linkedin = typeof linkedin !== 'undefined' ? linkedin : user.linkedin;
        user.leetcode = typeof leetcode !== 'undefined' ? leetcode : user.leetcode;
        user.github = typeof github !== 'undefined' ? github : user.github;

        // Location and academic details (applicable to both roles)
        user.country = typeof country !== 'undefined' ? country : user.country;
        user.state = typeof state !== 'undefined' ? state : user.state;
        user.college = typeof college !== 'undefined' ? college : user.college;
        user.branch = typeof branch !== 'undefined' ? branch : user.branch;

        if (user.role === 'teacher') {
            user.department = department || user.department;
        } else if (user.role === 'student') {
            user.rollNumber = rollNumber || user.rollNumber;
            user.class = userClass || user.class;
            user.semester = typeof semester !== 'undefined' ? semester : user.semester;
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                rollNumber: user.rollNumber,
                class: user.class,
                profileImage: user.profileImage,
                linkedin: user.linkedin,
                leetcode: user.leetcode,
                github: user.github,
                country: user.country,
                state: user.state,
                college: user.college,
                branch: user.branch,
                semester: user.semester
            }
        });
    } catch (error) {

        res.status(500).json({ message: 'Server error during profile update' });
    }
});

// @route   POST /api/auth/upload-profile-picture
// @desc    Upload or update profile picture
// @access  Private
router.post('/upload-profile-picture', auth, uploadProfilePicture.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old profile picture from Cloudinary if exists
        if (user.profileImagePublicId) {
            try {
                await deleteFromCloudinary(user.profileImagePublicId, 'image');
            } catch (deleteError) {
                console.error('Error deleting old profile picture:', deleteError);
                // Continue even if deletion fails
            }
        }

        // Update user with new profile picture
        user.profileImage = req.file.path; // Cloudinary URL
        user.profileImagePublicId = req.file.public_id;

        await user.save();

        res.json({
            message: 'Profile picture uploaded successfully',
            profileImage: user.profileImage
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        
        // Delete uploaded file from Cloudinary if error occurs
        if (req.file && req.file.public_id) {
            try {
                await deleteFromCloudinary(req.file.public_id, 'image');
            } catch (deleteError) {
                console.error('Error deleting file after error:', deleteError);
            }
        }
        
        res.status(500).json({ message: 'Server error while uploading profile picture' });
    }
});

// @route   DELETE /api/auth/delete-profile-picture
// @desc    Delete profile picture
// @access  Private
router.delete('/delete-profile-picture', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.profileImage) {
            return res.status(400).json({ message: 'No profile picture to delete' });
        }

        // Delete from Cloudinary
        if (user.profileImagePublicId) {
            try {
                await deleteFromCloudinary(user.profileImagePublicId, 'image');
            } catch (deleteError) {
                console.error('Error deleting from Cloudinary:', deleteError);
                // Continue with database update even if Cloudinary deletion fails
            }
        }

        // Remove from database
        user.profileImage = '';
        user.profileImagePublicId = '';
        await user.save();

        res.json({ message: 'Profile picture deleted successfully' });
    } catch (error) {
        console.error('Profile picture deletion error:', error);
        res.status(500).json({ message: 'Server error while deleting profile picture' });
    }
});

module.exports = router;