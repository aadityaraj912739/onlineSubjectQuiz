import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from '../components/Loading.jsx';
import toast from 'react-hot-toast';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState({
    department: '',
    rollNumber: '',
    class: '',
    semester: ''
  });
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if user already has a role
  React.useEffect(() => {
    if (user?.role) {
      const from = location.state?.from || (user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard');
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Clear additional info when switching roles
    setAdditionalInfo({
      department: '',
      rollNumber: '',
      class: '',
      semester: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdditionalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);

    try {
      const roleData = { role: selectedRole };
      
      // Add role-specific fields
      if (selectedRole === 'teacher') {
        roleData.department = additionalInfo.department;
      } else if (selectedRole === 'student') {
        roleData.rollNumber = additionalInfo.rollNumber;
        roleData.class = additionalInfo.class;
        roleData.semester = additionalInfo.semester;
      }

      const response = await api.post('/auth/google/set-role', roleData);
      
      if (response.data.user) {
        // Refresh user data in background
        await api.get('/auth/me');
        
        toast.success('Role set successfully!');
        
        // Navigate to appropriate dashboard
        const redirectPath = selectedRole === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      console.error('Role selection error:', error);
      const message = error.response?.data?.message || 'Failed to set role. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Setting up your account..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-dark-950 dark:via-dark-925 dark:to-dark-900 py-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-glow transform hover:scale-110 transition-transform duration-300">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h2 className="mt-6 text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Welcome, {user?.name}!
          </h2>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Please select your role to continue
          </p>
        </div>

        {/* Role Selection */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Teacher Card */}
            <div
              onClick={() => handleRoleSelect('teacher')}
              className={`relative cursor-pointer rounded-2xl p-8 transition-all duration-300 ${
                selectedRole === 'teacher'
                  ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow scale-105'
                  : 'bg-white dark:bg-dark-850 border-2 border-gray-200 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500'
              }`}
            >
              <div className="text-center">
                <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4 ${
                  selectedRole === 'teacher' 
                    ? 'bg-white/20' 
                    : 'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800'
                }`}>
                  <svg className={`h-10 w-10 ${selectedRole === 'teacher' ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${selectedRole === 'teacher' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  Teacher
                </h3>
                <p className={`text-sm ${selectedRole === 'teacher' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                  Create and manage exams, view student results
                </p>
              </div>
              {selectedRole === 'teacher' && (
                <div className="mt-4">
                  <svg className="absolute top-4 right-4 h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Student Card */}
            <div
              onClick={() => handleRoleSelect('student')}
              className={`relative cursor-pointer rounded-2xl p-8 transition-all duration-300 ${
                selectedRole === 'student'
                  ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-glow scale-105'
                  : 'bg-white dark:bg-dark-850 border-2 border-gray-200 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500'
              }`}
            >
              <div className="text-center">
                <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4 ${
                  selectedRole === 'student' 
                    ? 'bg-white/20' 
                    : 'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800'
                }`}>
                  <svg className={`h-10 w-10 ${selectedRole === 'student' ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${selectedRole === 'student' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  Student
                </h3>
                <p className={`text-sm ${selectedRole === 'student' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                  Take exams, view results and study materials
                </p>
              </div>
              {selectedRole === 'student' && (
                <div className="mt-4">
                  <svg className="absolute top-4 right-4 h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information Form */}
          {selectedRole && (
            <div className="bg-white/90 dark:bg-dark-850/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-dark-700 animate-fadeIn">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Additional Information (Optional)
              </h4>
              
              {selectedRole === 'teacher' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={additionalInfo.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white transition-all"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={additionalInfo.rollNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 2021001"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Class
                      </label>
                      <input
                        type="text"
                        name="class"
                        value={additionalInfo.class}
                        onChange={handleInputChange}
                        placeholder="e.g., CSE-A"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Semester
                      </label>
                      <input
                        type="text"
                        name="semester"
                        value={additionalInfo.semester}
                        onChange={handleInputChange}
                        placeholder="e.g., 5"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 text-gray-900 dark:text-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedRole || loading}
            className={`w-full py-4 px-6 border border-transparent rounded-xl text-white font-semibold text-lg transition-all duration-300 ${
              selectedRole && !loading
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-glow transform hover:scale-105'
                : 'bg-gray-300 dark:bg-dark-700 cursor-not-allowed'
            }`}
          >
            Continue to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelection;
