import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '../components/Loading.jsx';
import { formatRelativeTime, getExamStatus } from '../utils/helpers';

const TeacherDashboard = () => {
  const { user } = useAuth();
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

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://onlinesubjectquiz.onrender.com/api/exams/teacher', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedExams = response.data.exams;
      setExams(fetchedExams);
      
      // Calculate stats
      const totalExams = fetchedExams.length;
      const activeExams = fetchedExams.filter(exam => getExamStatus(exam).status === 'Active').length;
      const totalParticipants = fetchedExams.reduce((sum, exam) => sum + (exam.participantCount || 0), 0);
      
      const examsWithScores = fetchedExams.filter(exam => exam.participantCount > 0);
      const totalAverageScore = examsWithScores.reduce((sum, exam) => sum + parseFloat(exam.averageScore || 0), 0);
      const averagePerformance = examsWithScores.length > 0 ? (totalAverageScore / examsWithScores.length) : 0;

      setStats({
        totalExams,
        activeExams,
        totalParticipants,
        averagePerformance: averagePerformance.toFixed(2),
      });
    } catch (error) {
      // Error fetching exams
      toast.error('Failed to fetch exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
            Manage your exams and track student performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Exams</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalExams}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Active Exams</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.activeExams}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Participants</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalParticipants}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Performance</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.averagePerformance}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/create-exam')}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg p-6 transition-all transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <span className="text-4xl">➕</span>
              <div className="text-left">
                <h3 className="text-xl font-bold">Create New Exam</h3>
                <p className="text-primary-100 text-sm">Design and publish a new exam</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/study-materials')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg p-6 transition-all transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <span className="text-4xl">📚</span>
              <div className="text-left">
                <h3 className="text-xl font-bold">Study Materials</h3>
                <p className="text-blue-100 text-sm">Upload notes, PDFs & suggestions</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/previous-papers')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-lg p-6 transition-all transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <span className="text-4xl">📄</span>
              <div className="text-left">
                <h3 className="text-xl font-bold">Previous Papers</h3>
                <p className="text-purple-100 text-sm">Upload question papers by location</p>
              </div>
            </div>
          </button>
        </div>

        {/* Exams Table */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Exams</h2>
            <Link to="/create-exam" className="btn-primary">
              Create New Exam
            </Link>
          </div>

          {exams.length === 0 ? (
            <div className="card text-center py-12">
              <svg className="w-16 h-16 text-gray-300 dark:text-dark-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No exams yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first exam to get started</p>
              <Link to="/create-exam" className="btn-primary">
                Create Your First Exam
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-dark-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
                <thead className="bg-gray-50 dark:bg-dark-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Exam Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Subject
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Exam Key
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Participants
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Avg. Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-900 divide-y divide-gray-200 dark:divide-dark-700">
                  {exams.slice(0, 6).map((exam) => {
                    const statusInfo = getExamStatus(exam);
                    return (
                      <tr key={exam._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center mr-4">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{exam.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {exam.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <span>{exam.examKey}</span>
                            <button onClick={() => copyExamKey(exam.examKey)} className="ml-2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-dark-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.color}`}>
                            {statusInfo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {exam.participantCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {exam.averageScore ? `${parseFloat(exam.averageScore).toFixed(2)}%` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(exam.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            to={`/results/${exam._id}`}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            View Results
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;