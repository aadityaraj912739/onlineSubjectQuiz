import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateExam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    description: '',
    duration: 60,
    startTime: '',
    endTime: ''
  });
  const [questions, setQuestions] = useState([
    {
      question: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      marks: 1,
      timePerQuestion: 60
    }
  ]);
  const [errors, setErrors] = useState({});

  // Get minimum datetime for validation (current datetime)
  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleExamDataChange = (e) => {
    const { name, value } = e.target;
    setExamData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex].text = value;
    setQuestions(updatedQuestions);
  };

  const handleCorrectOptionChange = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    // Reset all options to false
    updatedQuestions[questionIndex].options.forEach(option => {
      option.isCorrect = false;
    });
    // Set selected option as correct
    updatedQuestions[questionIndex].options[optionIndex].isCorrect = true;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        marks: 1,
        timePerQuestion: 60
      }
    ]);
  };

  const removeQuestion = (questionIndex) => {
    if (questions.length > 1) {
      const updatedQuestions = questions.filter((_, index) => index !== questionIndex);
      setQuestions(updatedQuestions);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate exam data
    if (!examData.title.trim()) {
      newErrors.title = 'Exam title is required';
    }
    if (!examData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!examData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!examData.endTime) {
      newErrors.endTime = 'End time is required';
    }
    if (examData.startTime && examData.endTime && new Date(examData.startTime) >= new Date(examData.endTime)) {
      newErrors.endTime = 'End time must be after start time';
    }

    // Validate questions
    questions.forEach((question, qIndex) => {
      if (!question.question.trim()) {
        newErrors[`question_${qIndex}`] = `Question ${qIndex + 1} text is required`;
      }

      const hasCorrectAnswer = question.options.some(option => option.isCorrect);
      if (!hasCorrectAnswer) {
        newErrors[`correct_${qIndex}`] = `Question ${qIndex + 1} must have a correct answer`;
      }

      question.options.forEach((option, oIndex) => {
        if (!option.text.trim()) {
          newErrors[`option_${qIndex}_${oIndex}`] = `Option ${oIndex + 1} for question ${qIndex + 1} is required`;
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);
    try {
      // Convert datetime-local values to ISO strings with proper timezone
      const startDateTime = new Date(examData.startTime);
      const endDateTime = new Date(examData.endTime);
      
      await axios.post('/exams', {
        ...examData,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        questions
      });

      toast.success('Exam created successfully!');
      navigate('/teacher');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create exam';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Create New Exam</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Set up your MCQ exam with questions and options
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exam Details */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Exam Details</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exam Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={examData.title}
                  onChange={handleExamDataChange}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-dark-900 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'}`}
                  placeholder="e.g., Mathematics Mid-term Exam"
                />
                {errors.title && <p className="mt-1.5 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={examData.subject}
                  onChange={handleExamDataChange}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-dark-900 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.subject ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'}`}
                  placeholder="e.g., Mathematics"
                />
                {errors.subject && <p className="mt-1.5 text-sm text-red-600">{errors.subject}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={examData.description}
                  onChange={handleExamDataChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Brief description of the exam (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={examData.duration}
                  onChange={handleExamDataChange}
                  min="1"
                  className="w-full px-4 py-2.5 bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={examData.startTime}
                  onChange={handleExamDataChange}
                  min={getMinDateTime()}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-dark-900 border rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.startTime ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'}`}
                />
                {errors.startTime && <p className="mt-1.5 text-sm text-red-600">{errors.startTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={examData.endTime}
                  onChange={handleExamDataChange}
                  min={examData.startTime || getMinDateTime()}
                  className={`w-full px-4 py-2.5 bg-white dark:bg-dark-900 border rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.endTime ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'}`}
                />
                {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Questions ({questions.length})
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 text-sm font-semibold bg-primary-500 text-white rounded-full hover:bg-primary-600 active:bg-primary-700 transition-colors"
              >
                Add Question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((question, questionIndex) => (
                <div key={questionIndex} className="bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Question {questionIndex + 1}
                  </h3>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(questionIndex)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                      rows={2}
                      className={`w-full px-4 py-2.5 bg-white dark:bg-dark-800 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors[`question_${questionIndex}`] ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'}`}
                      placeholder="Enter your question here..."
                    />
                    {errors[`question_${questionIndex}`] && (
                      <p className="mt-1.5 text-sm text-red-600">{errors[`question_${questionIndex}`]}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct_${questionIndex}`}
                            checked={option.isCorrect}
                            onChange={() => handleCorrectOptionChange(questionIndex, optionIndex)}
                            className="w-4 h-4 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                            className={`flex-1 px-4 py-2.5 bg-white dark:bg-dark-800 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors[`option_${questionIndex}_${optionIndex}`] ? 'border-red-500' : 'border-gray-300 dark:border-dark-600'}`}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                        </div>
                        {errors[`option_${questionIndex}_${optionIndex}`] && (
                          <p className="mt-1.5 ml-7 text-sm text-red-600">{errors[`option_${questionIndex}_${optionIndex}`]}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {errors[`correct_${questionIndex}`] && (
                    <p className="text-sm text-red-600">{errors[`correct_${questionIndex}`]}</p>
                  )}

                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Marks:
                      </label>
                      <input
                        type="number"
                        value={question.marks}
                        onChange={(e) => handleQuestionChange(questionIndex, 'marks', parseInt(e.target.value) || 1)}
                        min="1"
                        max="10"
                        className="w-16 px-3 py-1.5 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Time (seconds):
                      </label>
                      <input
                        type="number"
                        value={question.timePerQuestion}
                        onChange={(e) => handleQuestionChange(questionIndex, 'timePerQuestion', parseInt(e.target.value) || 60)}
                        min="10"
                        max="600"
                        className="w-20 px-3 py-1.5 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/teacher')}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold bg-primary-500 text-white rounded-full hover:bg-primary-600 active:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Exam...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;