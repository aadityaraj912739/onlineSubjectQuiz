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
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['teacher', 'student'],
        required: true
    },
    profileImage: {
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
            return this.role === 'teacher';
        }
    },
    // For students
    rollNumber: {
        type: String,
        required: function() {
            return this.role === 'student';
        }
    },
    class: {
        type: String,
        required: function() {
            return this.role === 'student';
        }
    },
    semester: {
        type: String,
        required: function() {
            return this.role === 'student';
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
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
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);