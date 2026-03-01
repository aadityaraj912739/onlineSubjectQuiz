const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    selectedOption: {
        type: Number, // index of selected option, null if not answered
        default: null
    },
    isCorrect: {
        type: Boolean,
        required: true
    },
    marks: {
        type: Number,
        default: 0
    }
});

const resultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    answers: [answerSchema],
    totalMarks: {
        type: Number,
        required: true,
        default: 0
    },
    obtainedMarks: {
        type: Number,
        required: true,
        default: 0
    },
    percentage: {
        type: Number,
        required: true,
        default: 0
    },
    rank: {
        type: Number,
        default: null
    },
    timeTaken: {
        type: Number, // in seconds
        required: true
    },
    setNumber: {
        type: Number,
        default: 1
    },
    questionOrder: [{
        type: mongoose.Schema.Types.ObjectId
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    },
    isCompleted: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Calculate percentage before saving
resultSchema.pre('save', function(next) {
    if (this.totalMarks > 0) {
        this.percentage = Math.round((this.obtainedMarks / this.totalMarks) * 100);
    }
    next();
});

// Ensure one result per student per exam
resultSchema.index({ student: 1, exam: 1 }, { unique: true });

// Index for faster ranking queries
resultSchema.index({ exam: 1, obtainedMarks: -1 });

module.exports = mongoose.model('Result', resultSchema);