const mongoose = require('mongoose');
const crypto = require('crypto');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [{
        text: {
            type: String,
            required: true
        },
        isCorrect: {
            type: Boolean,
            default: false
        }
    }],
    marks: {
        type: Number,
        default: 1
    },
    timePerQuestion: {
        type: Number, // in seconds
        default: 60
    }
});

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questions: [questionSchema],
    duration: {
        type: Number, // in minutes
        required: true,
        default: 60
    },
    totalMarks: {
        type: Number,
        default: 0
    },
    examKey: {
        type: String,
        unique: true,
        default: function() {
            return crypto.randomBytes(6).toString('hex').toUpperCase();
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Generate unique exam key before saving
examSchema.pre('save', function(next) {
    // Always generate exam key if not present
    if (!this.examKey) {
        this.examKey = crypto.randomBytes(6).toString('hex').toUpperCase();
    }
    
    // Calculate total marks
    this.totalMarks = this.questions.reduce((total, question) => total + question.marks, 0);
    
    next();
});

// Index for faster queries
examSchema.index({ teacher: 1, createdAt: -1 });
examSchema.index({ examKey: 1 });
examSchema.index({ subject: 1 });

module.exports = mongoose.model('Exam', examSchema);