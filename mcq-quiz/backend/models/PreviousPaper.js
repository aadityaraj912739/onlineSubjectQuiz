const mongoose = require('mongoose');

const previousPaperSchema = new mongoose.Schema({
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
    year: {
        type: String,
        required: true,
        trim: true
    },
    // Filter fields
    country: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    college: {
        type: String,
        required: true,
        trim: true
    },
    branch: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: String,
        required: true,
        trim: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileUrl: {
        type: String,
        required: true,
        trim: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number
    },
    cloudinaryPublicId: {
        type: String,
        trim: true
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for fast filtering
previousPaperSchema.index({ country: 1, state: 1, college: 1, branch: 1, semester: 1 });
previousPaperSchema.index({ subject: 1, year: 1 });
previousPaperSchema.index({ teacher: 1 });
previousPaperSchema.index({ isActive: 1 });

module.exports = mongoose.model('PreviousPaper', previousPaperSchema);
