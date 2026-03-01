const express = require('express');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const { auth, isTeacher, isStudent } = require('../middleware/auth');

const router = express.Router();

// Seeded random number generator for deterministic shuffling
function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Shuffle array deterministically based on seed
function seededShuffle(array, seed) {
    const shuffled = [...array];
    let currentSeed = seed;
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(currentSeed) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        currentSeed++;
    }
    
    return shuffled;
}

// Generate set number from student ID (1-10)
function generateSetNumber(studentId) {
    const id = studentId.toString();
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash = hash & hash;
    }
    return (Math.abs(hash) % 10) + 1;
}

// @route   POST /api/exams
// @desc    Create new exam (Teacher only)
// @access  Private
router.post('/', auth, isTeacher, async (req, res) => {
    try {
        const { title, subject, description, questions, duration, startTime, endTime } = req.body;

        // Validate questions
        if (!questions || questions.length === 0) {
            return res.status(400).json({ message: 'At least one question is required' });
        }

        // Validate each question has 4 options and exactly one correct answer
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            if (!question.options || question.options.length !== 4) {
                return res.status(400).json({ 
                    message: `Question ${i + 1} must have exactly 4 options` 
                });
            }

            const correctOptions = question.options.filter(opt => opt.isCorrect);
            if (correctOptions.length !== 1) {
                return res.status(400).json({ 
                    message: `Question ${i + 1} must have exactly one correct answer` 
                });
            }
        }

        const crypto = require('crypto');
        const examKey = crypto.randomBytes(6).toString('hex').toUpperCase();

        const exam = new Exam({
            title,
            subject,
            description,
            teacher: req.user._id,
            questions,
            duration: duration || 60,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            examKey
        });

        await exam.save();

        res.status(201).json({
            message: 'Exam created successfully',
            exam: {
                id: exam._id,
                title: exam.title,
                subject: exam.subject,
                examKey: exam.examKey,
                totalMarks: exam.totalMarks,
                duration: exam.duration,
                questionsCount: exam.questions.length,
                startTime: exam.startTime,
                endTime: exam.endTime,
                createdAt: exam.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating exam' });
    }
});

// @route   GET /api/exams/teacher
// @desc    Get all exams created by teacher (sorted by recent)
// @access  Private
router.get('/teacher', auth, isTeacher, async (req, res) => {
    try {
        const exams = await Exam.find({ teacher: req.user._id })
            .sort({ createdAt: -1 })
            .select('-questions.options.isCorrect')
            .populate('teacher', 'name department');

        const examsWithStats = await Promise.all(
            exams.map(async (exam) => {
                const results = await Result.find({ exam: exam._id });
                const participantCount = results.length;
                
                const totalMarks = results.reduce((sum, r) => sum + r.obtainedMarks, 0);
                const averageScore = participantCount > 0 ? (totalMarks / participantCount) : 0;
                const averageScorePercentage = exam.totalMarks > 0 ? (averageScore / exam.totalMarks) * 100 : 0;

                return {
                    ...exam.toObject(),
                    participantCount,
                    averageScore: averageScorePercentage.toFixed(2),
                };
            })
        );

        res.json({ exams: examsWithStats });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching exams' });
    }
});

// @route   GET /api/exams/available
// @desc    Get all available exams for students
// @access  Private
router.get('/available', auth, isStudent, async (req, res) => {
    try {
        const now = new Date();
        
        // Find exams that are currently active
        const availableExams = await Exam.find({
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).select('-questions');

        // Find results for the current student
        const studentResults = await Result.find({ student: req.user._id }).select('exam');
        const takenExamIds = studentResults.map(result => result.exam.toString());

        // Filter out exams that the student has already taken
        const examsForStudent = availableExams.filter(exam => !takenExamIds.includes(exam._id.toString()));

        res.json(examsForStudent);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching available exams' });
    }
});

// @route   GET /api/exams/:id
// @desc    Get exam details
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('teacher', 'name department');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // If student is requesting, don't send correct answers
        let examData = exam.toObject();
        if (req.user.role === 'student') {
            examData.questions = exam.questions.map(q => ({
                _id: q._id,
                question: q.question,
                options: q.options.map(opt => ({
                    text: opt.text
                })),
                marks: q.marks
            }));
        }

        res.json({ exam: examData });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching exam' });
    }
});

// @route   GET /api/exams/key/:examKey
// @desc    Get exam by key (for students)
// @access  Private
router.get('/key/:examKey', auth, isStudent, async (req, res) => {
    try {
        const exam = await Exam.findOne({ examKey: req.params.examKey })
            .populate('teacher', 'name department');

        if (!exam) {
            return res.status(404).json({ message: 'Invalid exam key' });
        }

        // Check if exam is active and within time bounds
        const now = new Date();
        if (!exam.isActive) {
            return res.status(400).json({ message: 'This exam is not active' });
        }

        if (now < exam.startTime) {
            return res.status(400).json({ message: 'Exam has not started yet' });
        }

        if (now > exam.endTime) {
            return res.status(400).json({ message: 'Exam has ended' });
        }

        // Check if student has already taken this exam
        const existingResult = await Result.findOne({
            student: req.user._id,
            exam: exam._id
        });

        if (existingResult) {
            return res.status(400).json({ message: 'You have already taken this exam' });
        }

        // Send exam without correct answers
        const examData = {
            id: exam._id,
            title: exam.title,
            subject: exam.subject,
            description: exam.description,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            teacher: exam.teacher,
            questions: exam.questions.map(q => ({
                _id: q._id,
                question: q.question,
                options: q.options.map(opt => ({
                    text: opt.text
                })),
                marks: q.marks
            })),
            startTime: exam.startTime,
            endTime: exam.endTime
        };

        res.json({ exam: examData });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching exam' });
    }
});

// @route   PUT /api/exams/:id
// @desc    Update exam (Teacher only)
// @access  Private
router.put('/:id', auth, isTeacher, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if teacher owns this exam
        if (exam.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. You can only update your own exams.' });
        }

        // Check if exam has any submissions
        const hasSubmissions = await Result.countDocuments({ exam: exam._id });
        if (hasSubmissions > 0) {
            return res.status(400).json({ message: 'Cannot update exam that has submissions' });
        }

        const { title, subject, description, questions, duration, startTime, endTime, isActive } = req.body;

        // Update exam
        const updatedExam = await Exam.findByIdAndUpdate(
            req.params.id,
            {
                title,
                subject,
                description,
                questions,
                duration,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                isActive
            },
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Exam updated successfully',
            exam: updatedExam
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating exam' });
    }
});

// @route   DELETE /api/exams/:id
// @desc    Delete exam (Teacher only)
// @access  Private
router.delete('/:id', auth, isTeacher, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if teacher owns this exam
        if (exam.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. You can only delete your own exams.' });
        }

        // Delete all results for this exam
        await Result.deleteMany({ exam: exam._id });

        // Delete exam
        await Exam.findByIdAndDelete(req.params.id);

        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting exam' });
    }
});

// @route   POST /api/exams/join
// @desc    Join an exam using an exam key
// @access  Private (Student)
router.post('/join', auth, isStudent, async (req, res) => {
    const { examKey } = req.body;

    if (!examKey) {
        return res.status(400).json({ message: 'Exam key is required' });
    }

    try {
        const exam = await Exam.findOne({ examKey: examKey.trim() });

        if (!exam) {
            return res.status(404).json({ message: 'Invalid exam key' });
        }

        const now = new Date();
        if (!exam.isActive || now < exam.startTime || now > exam.endTime) {
            return res.status(400).json({ message: 'This exam is not currently active.' });
        }

        const existingResult = await Result.findOne({
            student: req.user._id,
            exam: exam._id
        });

        if (existingResult) {
            return res.status(400).json({ message: 'You have already taken this exam.' });
        }

        res.json({ examId: exam._id });

    } catch (error) {
        res.status(500).json({ message: 'Server error while trying to join the exam.' });
    }
});

// @route   GET /api/exams/:id/questions
// @desc    Get exam questions for students (without answers)
// @access  Private (Student)
router.get('/:id/questions', auth, isStudent, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('teacher', 'name email');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const now = new Date();
        if (now < exam.startTime) {
            return res.status(400).json({ message: 'Exam has not started yet' });
        }

        if (now > exam.endTime) {
            return res.status(400).json({ message: 'Exam has already ended' });
        }

        // Check if student has already taken this exam
        const existingResult = await Result.findOne({
            student: req.user._id,
            exam: exam._id
        });

        if (existingResult) {
            return res.status(400).json({ message: 'You have already taken this exam' });
        }

        // Generate set number based on student ID
        const setNumber = generateSetNumber(req.user._id);
        
        // Create seed from student ID and exam ID for deterministic randomization
        const seed = parseInt(req.user._id.toString().slice(-8), 16) + parseInt(exam._id.toString().slice(-8), 16);
        
        // Shuffle questions
        const questionsWithIndex = exam.questions.map((q, idx) => ({ question: q, originalIndex: idx }));
        const shuffledQuestions = seededShuffle(questionsWithIndex, seed);
        
        // Remove correct answers and shuffle options for each question
        const examData = {
            _id: exam._id,
            title: exam.title,
            subject: exam.subject,
            description: exam.description,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            startTime: exam.startTime,
            endTime: exam.endTime,
            teacher: exam.teacher,
            setNumber: setNumber,
            questions: shuffledQuestions.map((item, qIdx) => {
                const q = item.question;
                
                // Shuffle options for this question
                const optionsWithIndex = q.options.map((opt, idx) => ({ 
                    option: opt, 
                    originalIndex: idx 
                }));
                const shuffledOptions = seededShuffle(optionsWithIndex, seed + qIdx);
                
                return {
                    _id: q._id,
                    question: q.question,
                    options: shuffledOptions.map(item => ({
                        _id: item.option._id,
                        text: item.option.text,
                        originalIndex: item.originalIndex // Send original index for answer validation
                    })),
                    marks: q.marks,
                    timePerQuestion: q.timePerQuestion || 60
                };
            })
        };

        res.json(examData);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching exam questions' });
    }
});

// @route   GET /api/exams/previous-papers
// @desc    Get expired exams as previous papers with teacher info
// @access  Private
router.get('/previous-papers', auth, async (req, res) => {
    try {
        const now = new Date();
        
        // Find all expired exams
        const previousExams = await Exam.find({
            endTime: { $lt: now },
            isActive: true
        })
            .populate('teacher', 'name email')
            .select('title subject description startTime endTime duration totalMarks teacher createdAt')
            .sort({ endTime: -1 })
            .limit(50); // Limit to 50 most recent

        // Get result count for each exam
        const examsWithStats = await Promise.all(previousExams.map(async (exam) => {
            const resultCount = await Result.countDocuments({ exam: exam._id });
            const avgScore = await Result.aggregate([
                { $match: { exam: exam._id } },
                { $group: { _id: null, averagePercentage: { $avg: '$percentage' } } }
            ]);

            return {
                _id: exam._id,
                title: exam.title,
                subject: exam.subject,
                description: exam.description,
                startTime: exam.startTime,
                endTime: exam.endTime,
                duration: exam.duration,
                totalMarks: exam.totalMarks,
                teacher: exam.teacher,
                createdAt: exam.createdAt,
                totalStudents: resultCount,
                averageScore: avgScore.length > 0 ? avgScore[0].averagePercentage.toFixed(2) : 0
            };
        }));

        res.json(examsWithStats);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching previous papers' });
    }
});

// @route   GET /api/exams/previous-papers/:id/view
// @desc    View previous paper questions (for practice)
// @access  Private
router.get('/previous-papers/:id/view', auth, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('teacher', 'name email');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const now = new Date();
        if (now < exam.endTime) {
            return res.status(400).json({ message: 'This exam is still active and cannot be viewed as a previous paper' });
        }

        // Return full exam with correct answers for practice
        const examData = {
            _id: exam._id,
            title: exam.title,
            subject: exam.subject,
            description: exam.description,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            startTime: exam.startTime,
            endTime: exam.endTime,
            teacher: exam.teacher,
            questions: exam.questions.map(q => ({
                _id: q._id,
                question: q.question,
                options: q.options.map(opt => ({
                    _id: opt._id,
                    text: opt.text,
                    isCorrect: opt.isCorrect // Include correct answers for practice
                })),
                marks: q.marks
            }))
        };

        res.json(examData);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching previous paper' });
    }
});

module.exports = router;