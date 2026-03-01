import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

// Components
import Navbar from './components/Navbar.jsx';
import Loading from './components/Loading.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import CreateExam from './pages/CreateExam.jsx';
import TakeExam from './pages/TakeExam.jsx';
import ExamResults from './pages/ExamResults.jsx';
import Profile from './pages/Profile.jsx';
import DetailedResult from './pages/DetailedResult.jsx';
import StudyMaterials from './pages/StudyMaterials.jsx';
import PreviousPapers from './pages/PreviousPapers.jsx';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  return children;
};

// 404 Page Component
const NotFound = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 animate-fadeIn">
      <div className="text-center px-4">
        <div className="inline-block">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 mb-4">
            404
          </h1>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => window.history.back()}
            className="btn-secondary inline-flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Go Back</span>
          </button>
          {isAuthenticated && (
            <button 
              onClick={() => navigate(user?.role === 'teacher' ? '/teacher' : '/student')}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Content
const AppContent = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Loading McqQuiz..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-200">
      {isAuthenticated && <Navbar />}
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/teacher" 
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/student" 
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/create-exam" 
          element={
            <ProtectedRoute requiredRole="teacher">
              <CreateExam />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/exam/:examId" 
          element={
            <ProtectedRoute requiredRole="student">
              <TakeExam />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/results/:examId" 
          element={
            <ProtectedRoute>
              <ExamResults />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/result/detailed/:resultId" 
          element={
            <ProtectedRoute>
              <DetailedResult />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/study-materials" 
          element={
            <ProtectedRoute>
              <StudyMaterials />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/previous-papers" 
          element={
            <ProtectedRoute>
              <PreviousPapers />
            </ProtectedRoute>
          } 
        />

        {/* Default Routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'teacher' ? '/teacher' : '/student'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast notifications - Centered, Responsive & Highly Visible */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={12}
        containerClassName=""
        containerStyle={{
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        toastOptions={{
          // Default options
          className: '',
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            border: '3px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '16px',
            padding: '18px 24px',
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '0.3px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            minWidth: '320px',
            maxWidth: '90vw',
            width: 'fit-content',
            textAlign: 'center',
            lineHeight: '1.6',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          // Success
          success: {
            duration: 3000,
            style: {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#10b981',
            },
          },
          // Error
          error: {
            duration: 4500,
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#ef4444',
            },
          },
          // Loading
          loading: {
            style: {
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#3b82f6',
            },
          },
          // Info (custom type)
          blank: {
            style: {
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: '#ffffff',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            },
          },
        }}
      />
    </div>
  );
};

// Main App Component
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
