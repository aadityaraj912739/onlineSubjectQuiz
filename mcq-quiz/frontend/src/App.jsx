import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

// Components
import Navbar from './components/Navbar.jsx';
import Loading from './components/Loading.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import RoleSelection from './pages/RoleSelection.jsx';
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
    // If user doesn't have a role, allow access to role selection
    if (!user?.role) {
      return <Navigate to="/select-role" replace />;
    }
    return <Navigate to={user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} replace />;
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
              onClick={() => navigate(user?.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard')}
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

        {/* Role Selection Route (Protected but no role required) */}
        <Route 
          path="/select-role" 
          element={
            <ProtectedRoute>
              <RoleSelection />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/teacher-dashboard" 
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Alias for backward compatibility */}
        <Route 
          path="/teacher" 
          element={<Navigate to="/teacher-dashboard" replace />}
        />
        
        <Route 
          path="/student-dashboard" 
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Alias for backward compatibility */}
        <Route 
          path="/student" 
          element={<Navigate to="/student-dashboard" replace />}
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
              user?.role ? (
                <Navigate to={user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} replace />
              ) : (
                <Navigate to="/select-role" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast notifications - Optimized & Responsive */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        toastOptions={{
          // Default options
          className: '',
          duration: 3500,
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            WebkitTextFillColor: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.2px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            minWidth: '280px',
            maxWidth: '85vw',
            width: 'fit-content',
            textAlign: 'center',
            lineHeight: '1.5',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          },
          // Success
          success: {
            duration: 2500,
            style: {
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#10b981',
            },
          },
          // Error
          error: {
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
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
              WebkitTextFillColor: '#ffffff',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
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
              WebkitTextFillColor: '#ffffff',
              border: '3px solid rgba(255, 255, 255, 0.6)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            },
          },
        }}
      />
    </div>
  );
};

// Main App Component
function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  
  // Debug log for verification (remove in production)
  console.log('Google Client ID loaded:', googleClientId ? 'Yes' : 'No');
  
  if (!googleClientId) {
    console.error('REACT_APP_GOOGLE_CLIENT_ID is not defined in environment variables');
  }
  
  return (
    <GoogleOAuthProvider clientId={googleClientId || '156147048272-533837o45fjt5hcvskh3bh33nkc0hk72.apps.googleusercontent.com'}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
