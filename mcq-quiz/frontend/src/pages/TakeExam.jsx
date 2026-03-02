import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60);
  const questionTimersRef = useRef({});
  const [skippedQuestions, setSkippedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examStartTime] = useState(new Date());
  const [setNumber, setSetNumber] = useState(1);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(null);
  const timerIntervalRef = useRef(null);
  const isProcessingTimeoutRef = useRef(false);

  // Anti-cheating measures
  const [warningCount, setWarningCount] = useState(0);
  const warningCountRef = useRef(0); // Track actual count with ref to avoid stale closure
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const hasSubmittedRef = useRef(false);
  const wasInFullscreenRef = useRef(false); // Track if user was in fullscreen
  const hasLeftTabRef = useRef(false); // Track if user has left the tab
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const answersRef = useRef({}); // Keep ref of latest answers for auto-submit

  // Auto-save answers to localStorage
  const saveAnswersToLocalStorage = useCallback((answersToSave) => {
    try {
      const saveData = {
        answers: answersToSave,
        timestamp: new Date().toISOString(),
        examId: examId
      };
      localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save answers to localStorage:', error);
    }
  }, [examId]);

  // Load answers from localStorage
  const loadAnswersFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`exam_answers_${examId}`);
      if (savedData) {
        const { answers: savedAnswers, timestamp } = JSON.parse(savedData);
        console.log(`Restored answers from ${timestamp}`);
        return savedAnswers;
      }
    } catch (error) {
      console.error('Failed to load answers from localStorage:', error);
    }
    return null;
  }, [examId]);

  // Clear answers from localStorage
  const clearAnswersFromLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(`exam_answers_${examId}`);
    } catch (error) {
      console.error('Failed to clear answers from localStorage:', error);
    }
  }, [examId]);

  const handleSubmitExam = useCallback(async (autoSubmit = false, reason = '') => {
    if (submitting || hasSubmittedRef.current) return;
    
    hasSubmittedRef.current = true;
    setSubmitting(true);
    
    // Get the latest answers - use ref for auto-submit to avoid stale state
    let currentAnswers = answers;
    
    if (autoSubmit) {
      toast.error(`Exam auto-submitted: ${reason}`);
      // Use ref answers which are always up-to-date
      currentAnswers = answersRef.current;
      console.log('Auto-submit using answers:', currentAnswers);
    }
    
    try {
      const timeTaken = Math.floor((new Date() - examStartTime) / 1000); // in seconds
      
      const formattedAnswers = exam.questions.map((question, index) => {
        const selectedOptionIndex = currentAnswers[index];
        // Get the originalIndex from the selected option
        let originalOptionIndex = null;
        if (selectedOptionIndex !== null && selectedOptionIndex !== undefined) {
          const selectedOption = question.options[selectedOptionIndex];
          if (selectedOption && selectedOption.originalIndex !== undefined) {
            originalOptionIndex = selectedOption.originalIndex;
          }
        }
        
        return {
          questionId: question._id,
          selectedOption: selectedOptionIndex,
          originalOptionIndex: originalOptionIndex
        };
      });

      console.log('Submitting formatted answers:', formattedAnswers.filter(a => a.selectedOption !== null && a.selectedOption !== undefined).length, 'answered questions');

      const questionOrder = exam.questions.map(q => q._id);

      const response = await api.post('/results/submit', {
        examId: exam._id,
        answers: formattedAnswers,
        timeTaken: timeTaken,
        setNumber: setNumber,
        questionOrder: questionOrder
      });

      // Clear saved answers after successful submit
      clearAnswersFromLocalStorage();
      
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting, examStartTime, exam, answers, api, setNumber, navigate]);

  const fetchExamQuestions = useCallback(async () => {
    try {
      const response = await api.get(`/exams/${examId}/questions`);
      
      setExam(response.data);
      setSetNumber(response.data.setNumber || 1);
      setTimeLeft(response.data.duration * 60);
      
      // Initialize answers
      const initialAnswers = {};
      response.data.questions.forEach((_, index) => {
        initialAnswers[index] = null;
      });
      
      // Try to restore answers from localStorage
      const savedAnswers = loadAnswersFromLocalStorage();
      if (savedAnswers) {
        // Merge saved answers with initial answers
        Object.keys(savedAnswers).forEach(key => {
          if (initialAnswers.hasOwnProperty(key)) {
            initialAnswers[key] = savedAnswers[key];
          }
        });
        toast.success('Previous answers restored!');
      }
      
      setAnswers(initialAnswers);
      answersRef.current = initialAnswers; // Initialize ref with same data
      
      // Set timer for first question
      if (response.data.questions.length > 0) {
        const firstQuestionTime = response.data.questions[0].timePerQuestion || 60;
        setQuestionTimeLeft(firstQuestionTime);
        questionTimersRef.current = { 0: firstQuestionTime };
        setActiveQuestionIndex(0); // Start timer for first question
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load exam');
      navigate('/student');
    } finally {
      setLoading(false);
    }
  }, [api, examId, navigate, loadAnswersFromLocalStorage]);

  useEffect(() => {
    fetchExamQuestions();
  }, [fetchExamQuestions]);

  // Periodic auto-save (every 30 seconds)
  useEffect(() => {
    if (!exam || !answers || submitting) return;
    
    const autoSaveInterval = setInterval(() => {
      // Use ref to get latest answers
      saveAnswersToLocalStorage(answersRef.current);
      const answeredCount = Object.keys(answersRef.current).filter(k => answersRef.current[k] !== null).length;
      console.log('Answers auto-saved at', new Date().toLocaleTimeString(), '- Answered:', answeredCount);
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(autoSaveInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, answers, submitting]);

  // Anti-Cheating: Request fullscreen when exam starts
  useEffect(() => {
    if (exam && !loading) {
      // Show fullscreen prompt immediately when exam loads
      setShowFullscreenPrompt(true);
      
      // Listen for fullscreen exit - but only count as violation if user was in fullscreen
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement && wasInFullscreenRef.current && exam && !submitting && !hasSubmittedRef.current) {
          // User exited fullscreen after being in it
          handleViolation('Exited fullscreen mode');
          wasInFullscreenRef.current = false;
        } else if (document.fullscreenElement) {
          // User entered fullscreen
          wasInFullscreenRef.current = true;
        }
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, loading, submitting]);

  // Function to enable fullscreen
  const enableFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        wasInFullscreenRef.current = true;
        setShowFullscreenPrompt(false);
        toast.success('✅ Fullscreen mode activated! Exam started.');
      }
    } catch (err) {
      console.log('Fullscreen request failed:', err);
      toast.error('Please allow fullscreen to continue with the exam');
    }
  };

  // Anti-Cheating: Tab switching detection
  useEffect(() => {
    if (!exam || loading) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden && !submitting && !hasSubmittedRef.current) {
        // User left the tab - immediately save answers and count as violation
        if (!hasLeftTabRef.current) {
          hasLeftTabRef.current = true;
          // Auto-save latest answers from ref before warning
          saveAnswersToLocalStorage(answersRef.current);
          console.log('Tab switched - saved answers:', Object.keys(answersRef.current).filter(k => answersRef.current[k] !== null).length, 'answers');
          handleViolation('Switched to another tab/window');
        }
      } else if (!document.hidden) {
        // User came back to the tab - reset flag so next leave counts again
        hasLeftTabRef.current = false;
      }
    };
    
    // Only using visibility change - not blur to avoid duplicate warnings
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, loading, submitting, answers]);

  // Anti-Cheating: Disable copy-paste and keyboard shortcuts
  useEffect(() => {
    if (!exam || loading) return;
    
    const handleCopy = (e) => {
      e.preventDefault();
      toast.error('Copying is disabled during the exam');
      return false;
    };
    
    const handlePaste = (e) => {
      e.preventDefault();
      toast.error('Pasting is disabled during the exam');
      return false;
    };
    
    const handleCut = (e) => {
      e.preventDefault();
      toast.error('Cut operation is disabled during the exam');
      return false;
    };
    
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error('Right-click is disabled during the exam');
      return false;
    };
    
    const handleKeyDown = (e) => {
      // Disable common shortcuts
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'u', 's', 'a', 'p'].includes(e.key.toLowerCase())) ||
        (e.metaKey && ['c', 'v', 'x', 'u', 's', 'a', 'p'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' || // Dev tools
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) // Dev tools
      ) {
        e.preventDefault();
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey)) {
          handleViolation('Attempted to open developer tools');
        }
        return false;
      }
    };
    
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, loading]);

  // Anti-Cheating: Detect developer tools
  useEffect(() => {
    if (!exam || loading) return;
    
    let devToolsOpen = false;
    const threshold = 160;
    
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if ((widthThreshold || heightThreshold) && !devToolsOpen) {
        devToolsOpen = true;
        handleViolation('Developer tools detected');
      }
    };
    
    const interval = setInterval(detectDevTools, 1000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, loading]);

  // Handle violation and warnings
  const handleViolation = useCallback((message) => {
    if (submitting || hasSubmittedRef.current) return;
    
    // Increment ref immediately to get accurate count
    warningCountRef.current += 1;
    const newWarningCount = warningCountRef.current;
    const timestamp = new Date().toLocaleTimeString();
    
    // Update state for UI
    setWarningCount(newWarningCount);
    
    console.log(`[${timestamp}] Violation detected: ${message}. Warning count: ${newWarningCount}/3`);
    
    if (newWarningCount >= 3) {
      setWarningMessage(`Final Warning: ${message}. Exam will be auto-submitted now!`);
      setShowWarningModal(true);
      
      toast.error('⛔ Maximum warnings reached! Auto-submitting exam...');
      
      // Auto-submit after showing warning
      setTimeout(() => {
        handleSubmitExam(true, 'Multiple violations detected (3 warnings)');
      }, 3000);
    } else {
      setWarningMessage(`Warning ${newWarningCount}/3: ${message}`);
      setShowWarningModal(true);
      
      toast(`⚠️ Warning ${newWarningCount}/3: ${message}`, {
        icon: '⚠️',
        style: {
          background: '#FEF3C7',
          color: '#92400E',
          fontWeight: 'bold',
          border: '2px solid #F59E0B'
        }
      });
      
      // Auto-close warning after 3 seconds
      setTimeout(() => {
        setShowWarningModal(false);
      }, 3000);
    }
  }, [submitting, handleSubmitExam]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && exam) {
      handleSubmitExam();
    }
  }, [timeLeft, exam, handleSubmitExam]);

  // Per-question timer - only runs for the ACTIVE question
  useEffect(() => {
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Only start timer if this question is the actively viewed one
    if (exam && activeQuestionIndex === currentQuestion && !skippedQuestions.has(currentQuestion)) {
      if (questionTimeLeft > 0) {
        timerIntervalRef.current = setInterval(() => {
          setQuestionTimeLeft(prevTime => {
            const newTime = prevTime - 1;
            // Update stored time ONLY for current active question
            questionTimersRef.current[currentQuestion] = newTime;
            
            if (newTime <= 0) {
              // Time ran out for this question
              if (!isProcessingTimeoutRef.current) {
                isProcessingTimeoutRef.current = true;
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
                
                // Use setTimeout to avoid setState during render
                setTimeout(() => {
                  setSkippedQuestions(prev => new Set([...prev, currentQuestion]));
                  toast.error(`Time's up for question ${currentQuestion + 1}!`);
                  
                  // Move to next question if available
                  if (currentQuestion < exam.questions.length - 1) {
                    const nextQuestion = currentQuestion + 1;
                    setCurrentQuestion(nextQuestion);
                  } else {
                    // Last question, submit exam
                    handleSubmitExam();
                  }
                  isProcessingTimeoutRef.current = false;
                }, 0);
              }
              return 0;
            }
            
            return newTime;
          });
        }, 1000);
      } else if (questionTimeLeft === 0) {
        // Time already expired
        setSkippedQuestions(prev => new Set([...prev, currentQuestion]));
      }
    }

    // Cleanup
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, activeQuestionIndex, currentQuestion, skippedQuestions, handleSubmitExam]);

  // Handle question navigation - set timer when moving to a question
  useEffect(() => {
    if (exam && exam.questions[currentQuestion]) {
      if (skippedQuestions.has(currentQuestion)) {
        // Question time already expired
        setQuestionTimeLeft(0);
        setActiveQuestionIndex(null); // Don't run timer for expired question
      } else if (questionTimersRef.current[currentQuestion] !== undefined) {
        // Question was visited before, use remaining time
        setQuestionTimeLeft(questionTimersRef.current[currentQuestion]);
        setActiveQuestionIndex(currentQuestion); // Activate timer for this question
      } else {
        // First visit to this question, use full time
        const fullTime = exam.questions[currentQuestion].timePerQuestion || 60;
        setQuestionTimeLeft(fullTime);
        questionTimersRef.current[currentQuestion] = fullTime;
        setActiveQuestionIndex(currentQuestion); // Activate timer for this question
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, exam, skippedQuestions]);

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    // Don't allow selecting answer for skipped questions
    if (skippedQuestions.has(questionIndex)) {
      toast.error('Time ran out for this question');
      return;
    }
    
    const updatedAnswers = {
      ...answers,
      [questionIndex]: optionIndex
    };
    
    // Update both state and ref
    setAnswers(updatedAnswers);
    answersRef.current = updatedAnswers; // Keep ref updated for auto-submit
    
    // Auto-save to localStorage
    saveAnswersToLocalStorage(updatedAnswers);
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

  const getProgress = () => {
    return ((currentQuestion + 1) / exam?.questions?.length) * 100 || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 animate-pulse"></div>
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Loading Exam...</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Please wait while we prepare your questions</p>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md mx-auto border-2 border-gray-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Exam Not Found</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">The exam you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/student')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = exam.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 select-none">
      {/* Fullscreen Prompt Modal */}
      {showFullscreenPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-10 max-w-lg mx-4 border-4 border-blue-500 dark:border-blue-400 animate-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                🎯 Ready to Start Exam?
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                For a fair examination, this exam requires <span className="font-bold text-blue-600 dark:text-blue-400">fullscreen mode</span>. 
                <br/>Click below to enable fullscreen and begin your exam.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-900 dark:text-yellow-200 font-semibold">
                  ⚠️ Important: Exiting fullscreen or switching tabs will result in warnings. 3 warnings = Auto-submit!
                </p>
              </div>
              <button
                onClick={enableFullscreen}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white text-xl rounded-xl hover:shadow-2xl transition-all duration-300 font-bold transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Start Exam in Fullscreen
              </button>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
                Press ESC anytime to exit fullscreen (but you'll get a warning!)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4 border-4 border-red-500 dark:border-red-400 animate-in zoom-in duration-300">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                  {warningCount >= 3 ? '⚠️ EXAM AUTO-SUBMITTING' : '⚠️ VIOLATION DETECTED'}
                </h3>
                <p className="text-gray-900 dark:text-gray-100 font-semibold mb-4">
                  {warningMessage}
                </p>
                {warningCount < 3 && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg border-2 border-yellow-400 dark:border-yellow-600">
                    <p className="text-sm text-yellow-900 dark:text-yellow-200 font-medium">
                      🚨 {3 - warningCount} warning{3 - warningCount !== 1 ? 's' : ''} remaining before auto-submit!
                    </p>
                  </div>
                )}
                {warningCount >= 3 && (
                  <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border-2 border-red-400 dark:border-red-600">
                    <p className="text-sm text-red-900 dark:text-red-200 font-medium">
                      ⛔ Maximum warnings exceeded. Your exam is being submitted automatically...
                    </p>
                  </div>
                )}
              </div>
            </div>
            {warningCount < 3 && (
              <button
                onClick={() => setShowWarningModal(false)}
                className="mt-6 w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-500 dark:to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-bold"
              >
                I Understand
              </button>
            )}
          </div>
        </div>
      )}

      {/* Violations Indicator */}
      {warningCount > 0 && (
        <div className="fixed top-20 right-4 z-50 bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-xl shadow-2xl border-2 border-red-700 dark:border-red-400 animate-pulse">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-bold">Warnings: {warningCount}/3</span>
          </div>
        </div>
      )}
      {/* Header with timer and exam info */}
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-lg border-b-2 border-blue-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {exam.title}
                </h1>
                <span className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white text-xs md:text-sm font-semibold rounded-full shadow-lg animate-pulse">
                  Set {setNumber}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">{exam.subject}</p>
            </div>
            
            {/* Timer Stats */}
            <div className="flex items-center gap-3 md:gap-6">
              <div className="flex items-center gap-2 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 px-4 py-2 rounded-xl border-2 border-orange-300 dark:border-orange-700">
                <svg className="w-5 h-5 text-orange-700 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className={`text-base md:text-lg font-bold ${timeLeft < 300 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-orange-700 dark:text-orange-400'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">Total Time</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 px-4 py-2 rounded-xl border-2 border-green-300 dark:border-green-700">
                <svg className="w-5 h-5 text-green-700 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <div className={`text-base md:text-lg font-bold ${questionTimeLeft <= 10 ? 'text-red-600 dark:text-red-400 animate-pulse' : questionTimeLeft <= 30 ? 'text-orange-600 dark:text-orange-400' : 'text-green-700 dark:text-green-400'}`}>
                    {questionTimeLeft}s
                  </div>
                  <div className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">Question</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 px-4 py-2 rounded-xl border-2 border-blue-300 dark:border-blue-700">
                <svg className="w-5 h-5 text-blue-700 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-base md:text-lg font-bold text-blue-700 dark:text-blue-400">
                    {getAnsweredQuestionsCount()}/{exam.questions.length}
                  </div>
                  <div className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">Answered</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{Math.round(getProgress())}%</span>
            </div>
            <div className="w-full bg-gray-300 dark:bg-slate-700 rounded-full h-3 overflow-hidden border-2 border-gray-400 dark:border-slate-600">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${getProgress()}%` }}
              >
                <div className="h-full w-full bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-gray-200 dark:border-slate-700 p-6 md:p-8 transition-all duration-300 hover:shadow-2xl">
              {/* Question Header */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                      {currentQuestion + 1}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Question {currentQuestion + 1}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">of {exam.questions.length} questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-800/60 dark:to-yellow-800/60 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-bold border-2 border-amber-300 dark:border-amber-700 shadow-sm">
                      <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {currentQ.marks} Mark{currentQ.marks !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                {skippedQuestions.has(currentQuestion) && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 border-l-4 border-red-600 dark:border-red-500 rounded-r-xl shadow-md animate-pulse">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-red-700 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-900 dark:text-red-200 text-sm font-semibold">
                        ⏰ Time expired for this question. You cannot answer it anymore.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-blue-900/30 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <p className="text-gray-900 dark:text-gray-100 text-lg md:text-xl leading-relaxed font-medium">
                    {currentQ.question}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <label
                    key={index}
                    className={`group block p-5 border-2 rounded-xl transition-all duration-200 transform ${
                      skippedQuestions.has(currentQuestion)
                        ? 'border-gray-400 dark:border-slate-600 bg-gray-200 dark:bg-slate-700/70 cursor-not-allowed opacity-70'
                        : answers[currentQuestion] === index
                        ? 'border-blue-600 dark:border-blue-500 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 shadow-lg scale-[1.02]'
                        : 'border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer hover:scale-[1.01] hover:shadow-md bg-white dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <input
                          type="radio"
                          name={`question-${currentQuestion}`}
                          value={index}
                          checked={answers[currentQuestion] === index}
                          onChange={() => handleAnswerSelect(currentQuestion, index)}
                          disabled={skippedQuestions.has(currentQuestion)}
                          className="h-5 w-5 text-blue-600 dark:text-blue-500 focus:ring-2 focus:ring-blue-500 border-gray-400 dark:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold ${
                            answers[currentQuestion] === index
                              ? 'bg-blue-600 dark:bg-blue-500 text-white'
                              : 'bg-gray-300 dark:bg-slate-600 text-gray-800 dark:text-gray-200'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-gray-900 dark:text-gray-100 text-base md:text-lg font-medium">
                            {option.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t-2 border-gray-300 dark:border-slate-700">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 text-gray-900 dark:text-gray-100 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold border-2 border-gray-400 dark:border-slate-500 flex items-center justify-center gap-2 group"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <button
                  onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === exam.questions.length - 1}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold border-2 border-blue-700 dark:border-blue-400 flex items-center justify-center gap-2 group"
                >
                  Next
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-gray-200 dark:border-slate-700 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Questions
                </h3>
              </div>
              
              {/* Question Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-6">
                {exam.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`relative w-full aspect-square rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-110 border-2 ${
                      currentQuestion === index
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white shadow-lg scale-110 border-blue-700 dark:border-blue-400'
                        : skippedQuestions.has(index)
                        ? 'bg-gradient-to-br from-red-200 to-red-300 dark:from-red-800/70 dark:to-red-700/70 text-red-900 dark:text-red-200 border-red-400 dark:border-red-600'
                        : answers[index] !== null
                        ? 'bg-gradient-to-br from-green-200 to-emerald-300 dark:from-green-800/70 dark:to-emerald-700/70 text-green-900 dark:text-green-200 hover:shadow-md border-green-400 dark:border-green-600'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 border-gray-400 dark:border-slate-600'
                    }`}
                  >
                    {index + 1}
                    {currentQuestion === index && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 dark:bg-pink-400 rounded-full animate-ping"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="space-y-3 text-sm mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700/70 dark:to-blue-900/30 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-200 to-emerald-300 dark:from-green-800/70 dark:to-emerald-700/70 flex-shrink-0 shadow-sm border-2 border-green-400 dark:border-green-600"></div>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">Answered</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-slate-700 flex-shrink-0 shadow-sm border-2 border-gray-400 dark:border-slate-600"></div>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">Not Answered</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-200 to-red-300 dark:from-red-800/70 dark:to-red-700/70 flex-shrink-0 shadow-sm border-2 border-red-400 dark:border-red-600"></div>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">Time Expired</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 flex-shrink-0 shadow-sm border-2 border-blue-700 dark:border-blue-400"></div>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">Current</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 border-2 border-green-700 dark:border-green-400"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submit Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;