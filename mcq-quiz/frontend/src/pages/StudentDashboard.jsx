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

  const startExam = (examId) => {
    navigate(`/exam/${examId}`);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableExams.map((exam) => (
                <ExamCard key={exam._id} exam={exam} onStart={() => handleExamClick(exam)} />
              ))}
            </div>
          ) : (
            <div className="text-center bg-white dark:bg-gray-800 rounded-lg shadow p-12">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
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
            <div className="text-center bg-white dark:bg-gray-800 rounded-lg shadow p-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No results yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your results will appear here after you take an exam.</p>
            </div>
          )}
        </section>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <header className="mb-6 md:mb-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white">
            Welcome, {user?.name}!
          </h1>
          <p className="mt-2 text-sm md:text-base lg:text-lg text-gray-500 dark:text-gray-400">
            Your learning journey starts here.
          </p>
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
          <StatCard icon="📝" title="Exams Taken" value={summary.totalExamsTaken} color="blue" />
          <StatCard icon="📊" title="Average Score" value={`${summary.averageScore.toFixed(1)}%`} color="purple" />
          <StatCard icon="⏳" title="Active Exams" value={availableExams.filter(isExamActive).length} color="green" />
        </div>

        {/* Quick Access Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-10">
          <button
            onClick={() => navigate('/study-materials')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg p-4 md:p-6 transition-all transform hover:scale-105"
          >
            <div className="flex items-center space-x-3 md:space-x-4">
              <span className="text-3xl md:text-4xl">📚</span>
              <div className="text-left">
                <h3 className="text-base md:text-xl font-bold">Study Materials</h3>
                <p className="text-blue-100 text-xs md:text-sm">Access notes, PDFs & suggestions</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate('/previous-papers')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-lg p-4 md:p-6 transition-all transform hover:scale-105"
          >
            <div className="flex items-center space-x-3 md:space-x-4">
              <span className="text-3xl md:text-4xl">📄</span>
              <div className="text-left">
                <h3 className="text-base md:text-xl font-bold">Previous Papers</h3>
                <p className="text-purple-100 text-xs md:text-sm">Practice with past exams</p>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-10">
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-white mb-4">Join with Exam Key</h3>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                value={examKey}
                onChange={(e) => setExamKey(e.target.value)}
                placeholder="Enter Exam Key"
                className="flex-grow p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
              />
              <button
                onClick={joinExamByKey}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base whitespace-nowrap"
              >
                Join Exam
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <Tabs tabs={tabs} />
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Enter Exam Key</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                To start the exam "{selectedExam?.title}", please enter the unique key provided by your teacher.
              </p>
              <input
                type="text"
                value={examKey}
                onChange={(e) => setExamKey(e.target.value)}
                placeholder="Unique Exam Key"
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
              />
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
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

const StatCard = ({ icon, title, value, color }) => {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 flex items-center space-x-3 md:space-x-4 transform hover:scale-105 transition-transform duration-300">
      <div className={`p-2 md:p-3 rounded-full ${colors[color]}`}>
        <span className="text-xl md:text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

const ExamCard = ({ exam, onStart }) => (
  <div 
    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col justify-between"
    onClick={() => onStart(exam)}
  >
    <div>
      <div className="flex justify-between items-start">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white pr-2">{exam.title}</h3>
        <span className={`px-2 md:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${isExamActive(exam) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {isExamActive(exam) ? 'Active' : 'Upcoming'}
        </span>
      </div>
      <p className="text-xs md:text-sm font-medium text-indigo-500 dark:text-indigo-400 mt-1">{exam.subject}</p>
      <p className="text-gray-600 dark:text-gray-400 mt-3 md:mt-4 text-xs md:text-sm">{exam.description}</p>
    </div>
    <div className="mt-4 md:mt-6 border-t border-gray-200 dark:border-gray-700 pt-3 md:pt-4">
      <div className="flex justify-between text-xs md:text-sm text-gray-500 dark:text-gray-400">
        <span>Duration: <strong>{exam.duration} mins</strong></span>
        <span>Marks: <strong>{exam.totalMarks}</strong></span>
      </div>
      <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2">
        Starts: <strong>{formatDate(exam.startTime)}</strong>
      </div>
    </div>
  </div>
);

const ResultItem = ({ result, navigate, onDownloadExcel, onDownloadPDF }) => (
  <li className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex-1 min-w-[200px]">
        <p className="font-semibold text-gray-800 dark:text-white">{result.exam.title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Score: {result.obtainedMarks}/{result.totalMarks} ({((result.obtainedMarks / result.totalMarks) * 100).toFixed(1)}%)
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onDownloadExcel(result)}
          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md"
          title="Download Excel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button 
          onClick={() => onDownloadPDF(result)}
          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md"
          title="Download PDF"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
        <button 
          onClick={() => navigate(`/results/${result.exam._id}`)} 
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 whitespace-nowrap"
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