import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import Loading from '../components/Loading.jsx';
import { formatRelativeTime, getExamStatus } from '../utils/helpers';
import { usePerformanceMonitor } from '../components/PerformanceOptimizer.jsx';

const TeacherDashboard = memo(() => {
  usePerformanceMonitor('TeacherDashboard');
  
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    totalStudents: 0,
    averagePerformance: 0,
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const copyExamKey = (examKey) => {
    const tempInput = document.createElement('input');
    tempInput.value = examKey;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    toast.success('Exam key copied to clipboard!');
  };

  const fetchExams = useCallback(async () => {
    try {
      // Load cached data first for instant display
      const cachedExams = localStorage.getItem('teacher_exams');
      const cachedStats = localStorage.getItem('teacher_stats');
      
      if (cachedExams && cachedStats) {
        setExams(JSON.parse(cachedExams));
        setStats(JSON.parse(cachedStats));
        setLoading(false);
      }

      // Fetch fresh data in background using RequestIdleCallback
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          const response = await api.get('/exams/teacher');
          const fetchedExams = response.data.exams;
          setExams(fetchedExams);
      
          // Calculate stats
          const totalExams = fetchedExams.length;
          const activeExams = fetchedExams.filter(exam => getExamStatus(exam).status === 'Active').length;
          const totalParticipants = fetchedExams.reduce((sum, exam) => sum + (exam.participantCount || 0), 0);
          
          const examsWithScores = fetchedExams.filter(exam => exam.participantCount > 0);
          const totalAverageScore = examsWithScores.reduce((sum, exam) => sum + parseFloat(exam.averageScore || 0), 0);
          const averagePerformance = examsWithScores.length > 0 ? (totalAverageScore / examsWithScores.length) : 0;

          const newStats = {
            totalExams,
            activeExams,
            totalParticipants,
            averagePerformance: averagePerformance.toFixed(2),
          };

          setStats(newStats);
          
          // Update cache
          localStorage.setItem('teacher_exams', JSON.stringify(fetchedExams));
          localStorage.setItem('teacher_stats', JSON.stringify(newStats));
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        const response = await api.get('/exams/teacher');
        const fetchedExams = response.data.exams;
        setExams(fetchedExams);
    
        const totalExams = fetchedExams.length;
        const activeExams = fetchedExams.filter(exam => getExamStatus(exam).status === 'Active').length;
        const totalParticipants = fetchedExams.reduce((sum, exam) => sum + (exam.participantCount || 0), 0);
        
        const examsWithScores = fetchedExams.filter(exam => exam.participantCount > 0);
        const totalAverageScore = examsWithScores.reduce((sum, exam) => sum + parseFloat(exam.averageScore || 0), 0);
        const averagePerformance = examsWithScores.length > 0 ? (totalAverageScore / examsWithScores.length) : 0;

        const newStats = {
          totalExams,
          activeExams,
          totalParticipants,
          averagePerformance: averagePerformance.toFixed(2),
        };

        setStats(newStats);
        
        localStorage.setItem('teacher_exams', JSON.stringify(fetchedExams));
        localStorage.setItem('teacher_stats', JSON.stringify(newStats));
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to fetch exams. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
        <div className="max-w-7xl mx-auto py-8">
          <Loading text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your exams and track student performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 transition-all">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">Total Exams</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">{stats.totalExams}</p>
          </div>

          <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 transition-all">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">Active Exams</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">{stats.activeExams}</p>
          </div>

          <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 transition-all">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">Total Participants</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">{stats.totalParticipants}</p>
          </div>

          <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 transition-all">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">Avg. Performance</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">{stats.averagePerformance}%</p>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/create-exam')}
            className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 active:scale-95 transition-all text-left touch-manipulation"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="text-2xl sm:text-3xl">➕</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Create New Exam</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Design and publish</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/study-materials')}
            className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 active:scale-95 transition-all text-left touch-manipulation"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="text-2xl sm:text-3xl">📚</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Study Materials</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Upload notes & PDFs</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/previous-papers')}
            className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 active:scale-95 transition-all text-left touch-manipulation sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="text-2xl sm:text-3xl">📄</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Previous Papers</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Upload past papers</p>
              </div>
            </div>
          </button>
        </div>

        {/* Exams Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Recent Exams</h2>
            <Link to="/create-exam" className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-600 active:bg-primary-700 transition-all text-center touch-manipulation">
              Create New Exam
            </Link>
          </div>

          {exams.length === 0 ? (
            <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl text-center py-8 sm:py-12 px-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No exams yet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Create your first exam to get started</p>
              <Link to="/create-exam" className="inline-block px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-600 active:bg-primary-700 transition-all touch-manipulation">
                Create Your First Exam
              </Link>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {exams.slice(0, 6).map((exam) => {
                const statusInfo = getExamStatus(exam);
                return (
                  <div key={exam._id} className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex-1">{exam.title}</h3>
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${statusInfo.color}`}>
                            {statusInfo.status}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-primary-500 dark:text-primary-400 mb-2 sm:mb-3">{exam.subject}</p>
                        
                        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-6 gap-y-1 sm:gap-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span>Key:</span>
                            <span className="font-mono bg-gray-100 dark:bg-dark-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs">{exam.examKey}</span>
                            <button 
                              onClick={() => copyExamKey(exam.examKey)} 
                              className="p-0.5 sm:p-1 rounded-md hover:bg-gray-200 dark:hover:bg-dark-700 active:scale-95 transition-all touch-manipulation"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                              </svg>
                            </button>
                          </div>
                          <span className="text-[10px] sm:text-sm">👥 {exam.participantCount} participants</span>
                          <span className="text-[10px] sm:text-sm">📊 {exam.averageScore ? `${parseFloat(exam.averageScore).toFixed(2)}%` : 'N/A'} avg</span>
                          <span className="hidden sm:inline text-[10px] sm:text-sm">🕒 {formatRelativeTime(exam.createdAt)}</span>
                        </div>
                      </div>
                      
                      <Link 
                        to={`/results/${exam._id}`}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-primary-500 hover:text-primary-600 active:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 whitespace-nowrap text-center sm:text-left border border-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all touch-manipulation"
                      >
                        View Results →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TeacherDashboard.displayName = 'TeacherDashboard';

export default TeacherDashboard;