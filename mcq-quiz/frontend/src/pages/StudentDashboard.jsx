import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from '../components/Loading.jsx';
import { formatDate } from '../utils/helpers';
import Tabs from '../components/Tabs.jsx';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const StudentDashboard = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [availableExams, setAvailableExams] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [summary, setSummary] = useState({ totalExamsTaken: 0, averageScore: 0 });
  const [loading, setLoading] = useState(true);
  const [examKey, setExamKey] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [examsRes, resultsRes, summaryRes] = await Promise.all([
          api.get('/exams/available'),
          api.get('/results/my-results'),
          api.get('/results/student/summary'),
        ]);

        setAvailableExams(examsRes.data);
        setMyResults(resultsRes.data);
        setSummary(summaryRes.data);

      } catch (error) {
        // Failed to fetch student data
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api]);

  const handleExamClick = (exam) => {
    const hasTaken = myResults.some(result => result.exam._id === exam._id);
    if (hasTaken) {
      alert('You have already submitted this exam.');
      return;
    }
    setSelectedExam(exam);
    setIsModalOpen(true);
  };

  const handleModalSubmit = () => {
    if (!examKey.trim()) {
      alert('Please enter the exam key.');
      return;
    }
    // Note: In a real app, you'd verify the key against the selectedExam on the backend
    // For this implementation, we assume the key is correct and navigate.
    // The joinExamByKey function already provides robust backend validation.
    joinExamByKey(selectedExam._id);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedExam(null);
    setExamKey('');
  };

  const joinExamByKey = async () => {
    if (!examKey.trim()) {
      alert('Please enter an exam key.');
      return;
    }
    try {
      const res = await api.post('/exams/join', { examKey });
      navigate(`/exam/${res.data.examId}`);
    } catch (error) {
      // Error joining exam by key
      alert(error.response?.data?.message || 'An error occurred while trying to join the exam.');
    }
  };

  const downloadResultExcel = (result) => {
    if (!result) return;

    const data = [{
      'Exam': result.exam?.title || 'N/A',
      'Subject': result.exam?.subject || 'N/A',
      'Score': `${result.obtainedMarks}/${result.totalMarks}`,
      'Percentage': `${result.percentage.toFixed(2)}%`,
      'Rank': result.rank || 'N/A',
      'Set Number': result.setNumber || 1,
      'Time Taken': `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`,
      'Submitted At': new Date(result.submittedAt).toLocaleString()
    }];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Result');

    worksheet['!cols'] = [
      { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 12 },
      { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 20 }
    ];

    const fileName = `${result.exam?.title}_${user?.name}_Result.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const downloadResultPDF = (result) => {
    if (!result) return;

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(59, 130, 246);
    doc.text('Exam Result', 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student: ${user?.name || 'N/A'}`, 14, 35);
    doc.text(`Exam: ${result.exam?.title || 'N/A'}`, 14, 42);
    doc.text(`Subject: ${result.exam?.subject || 'N/A'}`, 14, 49);
    doc.text(`Score: ${result.obtainedMarks}/${result.totalMarks} (${result.percentage.toFixed(1)}%)`, 14, 56);
    doc.text(`Rank: ${result.rank || 'N/A'}`, 14, 63);
    doc.text(`Set Number: ${result.setNumber || 1}`, 14, 70);
    doc.text(`Time Taken: ${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`, 14, 77);
    doc.text(`Submitted: ${new Date(result.submittedAt).toLocaleString()}`, 14, 84);

    const fileName = `${result.exam?.title}_${user?.name}_Result.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return <Loading />;
  }

  const tabs = [
    {
      name: 'Available Exams',
      content: (
        <section>
          {loading ? (
            <Loading text="Loading exams..." />
          ) : availableExams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {availableExams.map((exam) => (
                <ExamCard key={exam._id} exam={exam} onStart={() => handleExamClick(exam)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No available exams</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Check back later for new exams.</p>
            </div>
          )}
        </section>
      )
    },
    {
      name: 'My Results',
      content: (
        <section>
          {myResults.length > 0 ? (
            <div className="border border-gray-200 dark:border-dark-800 rounded-2xl overflow-hidden">
              <ul>
                {myResults.map((result) => (
                  <ResultItem 
                    key={result._id} 
                    result={result} 
                    navigate={navigate}
                    onDownloadExcel={downloadResultExcel}
                    onDownloadPDF={downloadResultPDF}
                  />
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No results yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your results will appear here after you take an exam.</p>
            </div>
          )}
        </section>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome, {user?.name}!
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Your learning journey starts here.
          </p>
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <StatCard icon="📝" title="Exams Taken" value={summary.totalExamsTaken} />
          <StatCard icon="📊" title="Average Score" value={`${summary.averageScore.toFixed(1)}%`} />
          <StatCard icon="⏳" title="Active Exams" value={availableExams.filter(isExamActive).length} />
        </div>

        {/* Quick Access Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/study-materials')}
            className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 active:scale-95 transition-all text-left touch-manipulation"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="text-2xl sm:text-3xl">📚</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Study Materials</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Access notes & PDFs</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/previous-papers')}
            className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary-500 dark:hover:border-primary-500 active:scale-95 transition-all text-left touch-manipulation"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="text-2xl sm:text-3xl">📄</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Previous Papers</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Practice past exams</p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-dark-800 p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Join with Exam Key</h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              value={examKey}
              onChange={(e) => setExamKey(e.target.value)}
              placeholder="Enter Exam Key"
              className="flex-grow px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white"
            />
            <button
              onClick={joinExamByKey}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-500 text-white font-semibold text-sm sm:text-base rounded-full hover:bg-primary-600 active:bg-primary-700 transition-colors touch-manipulation whitespace-nowrap"
            >
              Join Exam
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-dark-800 p-4 sm:p-6">
          <Tabs tabs={tabs} />
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white dark:bg-dark-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl w-full max-w-md border border-gray-200 dark:border-dark-800">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Enter Exam Key</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                To start the exam "{selectedExam?.title}", please enter the unique key provided by your teacher.
              </p>
              <input
                type="text"
                value={examKey}
                onChange={(e) => setExamKey(e.target.value)}
                placeholder="Unique Exam Key"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white"
              />
              <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold rounded-full hover:bg-gray-100 dark:hover:bg-dark-800 active:scale-95 transition-all border border-gray-300 dark:border-dark-700 touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-primary-500 text-white font-semibold rounded-full hover:bg-primary-600 active:bg-primary-700 transition-all touch-manipulation"
                >
                  Start Exam
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value }) => {
  return (
    <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 flex items-center space-x-2 sm:space-x-4 hover:border-primary-500 dark:hover:border-primary-500 transition-all">
      <span className="text-xl sm:text-2xl flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

const ExamCard = ({ exam, onStart }) => (
  <div 
    className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 active:scale-95 transition-all flex flex-col justify-between touch-manipulation"
    onClick={() => onStart(exam)}
  >
    <div>
      <div className="flex justify-between items-start gap-2">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white pr-2">{exam.title}</h3>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
          isExamActive(exam) 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }`}>
          {isExamActive(exam) ? 'Active' : 'Upcoming'}
        </span>
      </div>
      <p className="text-xs sm:text-sm font-medium text-primary-500 dark:text-primary-400 mt-1">{exam.subject}</p>
      <p className="text-gray-600 dark:text-gray-400 mt-2 sm:mt-3 text-xs sm:text-sm line-clamp-2">{exam.description}</p>
    </div>
    <div className="mt-4 sm:mt-6 border-t border-gray-200 dark:border-dark-800 pt-3 sm:pt-4">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        <span>Duration: <strong className="text-gray-900 dark:text-white">{exam.duration} mins</strong></span>
        <span>Marks: <strong className="text-gray-900 dark:text-white">{exam.totalMarks}</strong></span>
      </div>
      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
        Starts: <strong className="text-gray-900 dark:text-white">{formatDate(exam.startTime)}</strong>
      </div>
    </div>
  </div>
);

const ResultItem = ({ result, navigate, onDownloadExcel, onDownloadPDF }) => (
  <li className="p-3 sm:p-5 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors border-b border-gray-200 dark:border-dark-800 last:border-0">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{result.exam.title}</p>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
          Score: {result.obtainedMarks}/{result.totalMarks} ({((result.obtainedMarks / result.totalMarks) * 100).toFixed(1)}%)
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button 
          onClick={() => onDownloadExcel(result)}
          className="p-1.5 sm:p-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg transition-colors touch-manipulation"
          title="Download Excel"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button 
          onClick={() => onDownloadPDF(result)}
          className="p-1.5 sm:p-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg transition-colors touch-manipulation"
          title="Download PDF"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
        <button 
          onClick={() => navigate(`/results/${result.exam._id}`)} 
          className="text-xs sm:text-sm font-medium text-primary-500 hover:text-primary-600 active:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 whitespace-nowrap touch-manipulation"
        >
          View Details &rarr;
        </button>
      </div>
    </div>
  </li>
);

// Helper function needs to be accessible by ExamCard
const isExamActive = (exam) => {
  const now = new Date();
  const startTime = new Date(exam.startTime);
  const endTime = new Date(exam.endTime);
  return now >= startTime && now <= endTime;
};

export default StudentDashboard;