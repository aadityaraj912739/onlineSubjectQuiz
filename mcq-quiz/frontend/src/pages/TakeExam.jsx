import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examStartTime] = useState(new Date());
  const [setNumber, setSetNumber] = useState(1);

  const handleSubmitExam = useCallback(async () => {
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      const timeTaken = Math.floor((new Date() - examStartTime) / 1000); // in seconds
      
      const formattedAnswers = exam.questions.map((question, index) => {
        const selectedOptionIndex = answers[index];
        // Get the originalIndex from the selected option
        const originalOptionIndex = selectedOptionIndex !== null && selectedOptionIndex !== undefined
          ? question.options[selectedOptionIndex]?.originalIndex
          : null;
        
        return {
          questionId: question._id,
          selectedOption: selectedOptionIndex,
          originalOptionIndex: originalOptionIndex
        };
      });

      const questionOrder = exam.questions.map(q => q._id);

      const response = await api.post('/results/submit', {
        examId: exam._id,
        answers: formattedAnswers,
        timeTaken: timeTaken,
        setNumber: setNumber,
        questionOrder: questionOrder
      });

      toast.success('Exam submitted successfully!');
      navigate('/student', { 
        state: { 
          examResult: response.data 
        }
      });
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  }, [submitting, examStartTime, exam, answers, api, setNumber, navigate]);

  const fetchExamQuestions = useCallback(async () => {
    try {
      const response = await api.get(`/exams/${examId}/questions`);
      
      setExam(response.data);
      setSetNumber(response.data.setNumber || 1);
      setTimeLeft(response.data.duration * 60);
      
      const initialAnswers = {};
      response.data.questions.forEach((_, index) => {
        initialAnswers[index] = null;
      });
      setAnswers(initialAnswers);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load exam');
      navigate('/student');
    } finally {
      setLoading(false);
    }
  }, [api, examId, navigate]);

  useEffect(() => {
    fetchExamQuestions();
  }, [fetchExamQuestions]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam) {
      handleSubmitExam();
    }
  }, [timeLeft, exam, handleSubmitExam]);

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredQuestionsCount = () => {
    return Object.values(answers).filter(answer => answer !== null).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-leetcode-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">Exam Not Found</h2>
          <button 
            onClick={() => navigate('/student')}
            className="px-4 py-2 bg-leetcode-orange text-white rounded-lg hover:bg-orange-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = exam.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Header with timer and exam info */}
      <div className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 md:gap-3">
                <h1 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">{exam.title}</h1>
                <span className="px-2 md:px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs md:text-sm font-semibold rounded-full shadow-md whitespace-nowrap">
                  Set {setNumber}
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{exam.subject}</p>
            </div>
            <div className="flex items-center space-x-3 md:space-x-6">
              <div className="text-center">
                <div className={`text-lg md:text-xl lg:text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-leetcode-orange'}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Time Left</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {getAnsweredQuestionsCount()}/{exam.questions.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Answered</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-4 md:p-6">
              <div className="mb-4 md:mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Question {currentQuestion + 1} of {exam.questions.length}
                  </h2>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                    {currentQ.marks} Mark{currentQ.marks !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <label
                    key={index}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentQuestion] === index
                        ? 'border-leetcode-orange bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name={`question-${currentQuestion}`}
                        value={index}
                        checked={answers[currentQuestion] === index}
                        onChange={() => handleAnswerSelect(currentQuestion, index)}
                        className="h-4 w-4 text-leetcode-orange focus:ring-leetcode-orange border-gray-300"
                      />
                      <span className="ml-3 text-gray-800 dark:text-gray-200">
                        {String.fromCharCode(65 + index)}. {option.text}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-6 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <button
                  onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === exam.questions.length - 1}
                  className="px-6 py-2 bg-leetcode-orange text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Questions</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-6">
                {exam.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentQuestion === index
                        ? 'bg-leetcode-orange text-white'
                        : answers[index] !== null
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="space-y-2 text-sm mb-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-100 dark:bg-dark-700 rounded mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Not Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-leetcode-orange rounded mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Current</span>
                </div>
              </div>

              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;