const express = require('express');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const { auth, isTeacher, isStudent } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/results/submit
// @desc    Submit exam answers (Student only)
// @access  Private
router.post('/submit', auth, isStudent, async (req, res) => {
    try {
        const { examId, answers, timeTaken, setNumber, questionOrder } = req.body;

        // Check if exam exists
        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if exam is still active
        const now = new Date();
        if (!exam.isActive) {
            return res.status(400).json({ message: 'Exam is no longer active' });
        }

        // For auto-submission, the time might be slightly over.
        // We allow a grace period for requests that come in right after expiry.
        const gracePeriod = 15000; // 15 seconds
        if (now > new Date(exam.endTime.getTime() + gracePeriod)) {
            return res.status(400).json({ message: 'The exam time has passed. Submission is closed.' });
        }

        // Check if student has already submitted
        const existingResult = await Result.findOne({
            student: req.user._id,
            exam: examId
        });

        if (existingResult) {
            return res.status(400).json({ message: 'You have already submitted this exam' });
        }

        // Calculate score
        let obtainedMarks = 0;
        const processedAnswers = [];

        for (let i = 0; i < answers.length; i++) {
            const answer = answers[i];
            const question = exam.questions.id(answer.questionId);
            
            if (!question) {
                continue;
            }

            // Handle shuffled options - answer.selectedOption is the shuffled index
            // answer.originalOptionIndex is the original position in the exam
            const originalOptionIndex = answer.originalOptionIndex;
            
            const isCorrect = (originalOptionIndex !== null && 
                              originalOptionIndex !== undefined && 
                              question.options[originalOptionIndex]?.isCorrect) || false;
            const marks = isCorrect ? question.marks : 0;
            obtainedMarks += marks;

            processedAnswers.push({
                questionId: answer.questionId,
                selectedOption: originalOptionIndex, // Store original index
                isCorrect,
                marks
            });
        }

        // Create result
        const result = new Result({
            student: req.user._id,
            exam: examId,
            answers: processedAnswers,
            totalMarks: exam.totalMarks,
            obtainedMarks,
            timeTaken: timeTaken || 0,
            setNumber: setNumber || 1,
            questionOrder: questionOrder || []
        });

        await result.save();

        // Calculate rank
        await calculateRanks(examId);

        // Get updated result with rank
        const finalResult = await Result.findById(result._id)
            .populate('exam', 'title subject totalMarks')
            .populate('student', 'name rollNumber');

        res.status(201).json({
            message: 'Exam submitted successfully',
            result: {
                id: finalResult._id,
                obtainedMarks: finalResult.obtainedMarks,
                totalMarks: finalResult.totalMarks,
                percentage: finalResult.percentage,
                rank: finalResult.rank,
                timeTaken: finalResult.timeTaken,
                submittedAt: finalResult.submittedAt,
                exam: finalResult.exam
            }
        });
    } catch (error) {
        console.error('Error submitting exam:', error);
        res.status(500).json({ message: 'Server error while submitting exam', error: error.message });
    }
});

// @route   GET /api/results/my-results
// @desc    Get all results for the logged-in student
// @access  Private (Student only)
router.get('/my-results', auth, isStudent, async (req, res) => {
    try {
        const results = await Result.find({ student: req.user._id })
            .populate('exam', 'title subject totalMarks startTime endTime')
            .sort({ submittedAt: -1 });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching results' });
    }
});

// @route   GET /api/results/student/summary
// @desc    Get summary statistics for the logged-in student
// @access  Private (Student only)
router.get('/student/summary', auth, isStudent, async (req, res) => {
    try {
        const results = await Result.find({ student: req.user._id });

        const totalExamsTaken = results.length;
        
        if (totalExamsTaken === 0) {
            return res.json({
                totalExamsTaken: 0,
                averageScore: 0,
            });
        }

        const totalPercentage = results.reduce((acc, result) => {
            const percentage = (result.obtainedMarks / result.totalMarks) * 100;
            return acc + percentage;
        }, 0);

        const averageScore = Math.round(totalPercentage / totalExamsTaken);

        res.json({
            totalExamsTaken,
            averageScore,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching student summary' });
    }
});

// @route   GET /api/results/my-result/:examId
// @desc    Get a student's result for a specific exam
// @access  Private (Student only)
router.get('/my-result/:examId', auth, isStudent, async (req, res) => {
    try {
        const result = await Result.findOne({
            exam: req.params.examId,
            student: req.user._id
        }).populate('student', 'name rollNumber class');

        if (!result) {
            return res.status(404).json({ message: 'Result not found for this exam.' });
        }

        const exam = await Exam.findById(req.params.examId).select('title subject totalMarks');

        res.json({ results: [result], exam });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching your exam result' });
    }
});

// @route   GET /api/results/exam/:examId
// @desc    Get all results for an exam (Teacher only)
// @access  Private
router.get('/exam/:examId', auth, isTeacher, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if teacher owns this exam
        if (exam.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. You can only view results for your own exams.' });
        }

        const results = await Result.find({ exam: req.params.examId })
            .populate('student', 'name rollNumber class')
            .sort({ obtainedMarks: -1, submittedAt: 1 });

        // Calculate and update ranks if needed
        await calculateRanks(req.params.examId);

        // Get updated results
        const updatedResults = await Result.find({ exam: req.params.examId })
            .populate('student', 'name rollNumber class')
            .sort({ rank: 1 });

        res.json({ results: updatedResults, exam: { title: exam.title, subject: exam.subject, totalMarks: exam.totalMarks } });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching exam results' });
    }
});

// @route   GET /api/results/ranking/:examId
// @desc    Get ranking for an exam (Teacher only)
// @access  Private
router.get('/ranking/:examId', auth, isTeacher, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId);
        
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if teacher owns this exam
        if (exam.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. You can only view rankings for your own exams.' });
        }

        const results = await Result.find({ exam: req.params.examId })
            .populate('student', 'name rollNumber class')
            .sort({ obtainedMarks: -1, timeTaken: 1 })
            .limit(50); // Top 50 students

        const ranking = results.map((result, index) => ({
            rank: index + 1,
            student: result.student,
            obtainedMarks: result.obtainedMarks,
            totalMarks: result.totalMarks,
            percentage: result.percentage,
            timeTaken: result.timeTaken,
            submittedAt: result.submittedAt
        }));

        res.json({ 
            ranking, 
            exam: { 
                title: exam.title, 
                subject: exam.subject, 
                totalMarks: exam.totalMarks 
            },
            totalStudents: results.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching ranking' });
    }
});

// @route   GET /api/results/detailed/:resultId
// @desc    Get detailed result with answers
// @access  Private
router.get('/detailed/:resultId', auth, async (req, res) => {
    try {
        const result = await Result.findById(req.params.resultId)
            .populate('exam')
            .populate('student', 'name rollNumber class');

        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }

        // Check access permissions
        const isOwner = result.student._id.toString() === req.user._id.toString();
        const isTeacherOfExam = req.user.role === 'teacher' && 
                               result.exam.teacher.toString() === req.user._id.toString();

        if (!isOwner && !isTeacherOfExam) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Prepare detailed result with questions and answers
        const detailedResult = {
            id: result._id,
            student: result.student,
            exam: {
                _id: result.exam._id,
                title: result.exam.title,
                subject: result.exam.subject,
                totalMarks: result.exam.totalMarks
            },
            obtainedMarks: result.obtainedMarks,
            totalMarks: result.totalMarks,
            percentage: result.percentage,
            rank: result.rank,
            timeTaken: result.timeTaken,
            submittedAt: result.submittedAt,
            answers: result.answers.map(answer => {
                const question = result.exam.questions.id(answer.questionId);
                return {
                    question: question?.question || 'Question not found',
                    options: question?.options || [],
                    selectedOption: answer.selectedOption,
                    isCorrect: answer.isCorrect,
                    marks: answer.marks,
                    maxMarks: question?.marks || 0
                };
            })
        };

        res.json({ result: detailedResult });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching detailed result' });
    }
});

// Helper function to calculate ranks for an exam
async function calculateRanks(examId) {
    try {
        const results = await Result.find({ exam: examId })
            .sort({ obtainedMarks: -1, timeTaken: 1 });

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            let rank = i + 1;

            // Handle ties
            if (i > 0) {
                const prevResult = results[i - 1];
                if (
                    result.obtainedMarks === prevResult.obtainedMarks &&
                    result.timeTaken === prevResult.timeTaken
                ) {
                    rank = prevResult.rank;
                }
            }
            
            await Result.findByIdAndUpdate(result._id, { $set: { rank: rank } });
        }
    } catch (error) {
        // Error calculating ranks
    }
}

module.exports = router;