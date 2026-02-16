import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const DetailedResult = () => {
  const { resultId } = useParams();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetailedResult = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/results/detailed/${resultId}`);
        setResult(response.data.result);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch detailed result.');
        // Fetch detailed result error
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedResult();
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <Loading text="Loading detailed result..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Link to={user?.role === 'teacher' ? "/teacher" : "/student"} className="btn-primary mt-6">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getOptionClassName = (option, question, selectedOption) => {
    let base = "p-3 rounded-lg border-2 transition-all ";
    const isSelected = option.id === selectedOption;
    const isCorrect = option.isCorrect;

    if (isSelected && isCorrect) {
      return base + "bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-500";
    }
    if (isSelected && !isCorrect) {
      return base + "bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-500";
    }
    if (!isSelected && isCorrect) {
      return base + "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700";
    }
    return base + "bg-gray-100 border-gray-300 dark:bg-dark-800 dark:border-dark-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to={`/results/${result.exam._id}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-4 inline-block">
            &larr; Back to Results
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Detailed Result for: {result.exam.title}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Student: {result.student.name} ({result.student.rollNumber})
          </p>
        </div>

        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Score</p>
              <p className="text-2xl font-bold">{result.obtainedMarks}/{result.totalMarks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Percentage</p>
              <p className="text-2xl font-bold">{result.percentage.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rank</p>
              <p className="text-2xl font-bold">#{result.rank}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time Taken</p>
              <p className="text-2xl font-bold">{`${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-6">Review Answers</h2>
          {result.answers.map((answer, index) => (
            <div key={index} className="card mb-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Q{index + 1}: {answer.question}
                </h3>
                <span className={`font-bold ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {answer.isCorrect ? `+${answer.marks}` : `+0`} / {answer.maxMarks}
                </span>
              </div>
              <div className="space-y-3">
                {answer.options.map((option) => (
                  <div key={option._id} className={getOptionClassName(option, answer, answer.selectedOption)}>
                    <p className="font-medium">{option.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailedResult;
