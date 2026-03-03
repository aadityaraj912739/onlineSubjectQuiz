const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Password not required for Google users
        },
        minlength: 6
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    role: {
        type: String,
        enum: ['teacher', 'student'],
        required: false // Will be set after Google login
    },
    profileImage: {
        type: String,
        default: ''
    },
    profileImagePublicId: {
        type: String,
        default: ''
    },
    linkedin: {
        type: String,
        default: ''
    },
    leetcode: {
        type: String,
        default: ''
    },
    github: {
        type: String,
        default: ''
    },
    // Common fields for both
    country: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    college: {
        type: String,
        default: ''
    },
    branch: {
        type: String,
        default: ''
    },
    // For teachers
    department: {
        type: String,
        required: function() {
            return this.role === 'teacher' && !this.googleId;
        }
    },
    // For students
    rollNumber: {
        type: String,
        required: function() {
            return this.role === 'student' && !this.googleId;
        }
    },
    class: {
        type: String,
        required: function() {
            return this.role === 'student' && !this.googleId;
        }
    },
    semester: {
        type: String,
        required: function() {
            return this.role === 'student' && !this.googleId;
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false; // No password for Google users
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);