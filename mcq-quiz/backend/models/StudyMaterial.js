const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['notes', 'pdf', 'suggestion_paper', 'other'],
        default: 'notes'
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileUrl: {
        type: String,
        trim: true
    },
    content: {
        type: String, // For text-based notes
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
studyMaterialSchema.index({ subject: 1, isActive: 1 });
studyMaterialSchema.index({ teacher: 1 });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
