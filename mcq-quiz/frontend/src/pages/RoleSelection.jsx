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
  const { api, user, refetchUser } = useAuth();
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
      
      console.log('[RoleSelection] Role set response:', response.data);
      console.log('[RoleSelection] User from response:', response.data.user);
      console.log('[RoleSelection] Profile image in response:', response.data.user?.profileImage);
      
      if (response.data.user) {
        toast.success('Role set successfully!');
        
        // Refresh user data to update role in context
        console.log('[RoleSelection] Refetching user data...');
        const updatedUser = await refetchUser();
        console.log('[RoleSelection] Updated user:', updatedUser);
        console.log('[RoleSelection] Profile image after refetch:', updatedUser?.profileImage);
        
        // Navigate to appropriate dashboard based on updated user role
        if (updatedUser && updatedUser.role) {
          const redirectPath = updatedUser.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
          console.log('[RoleSelection] Navigating to:', redirectPath);
          navigate(redirectPath, { replace: true });
        } else {
          console.error('[RoleSelection] Updated user has no role:', updatedUser);
          toast.error('Role was set but navigation failed. Please refresh the page.');
        }
      }
    } catch (error) {
      console.error('[RoleSelection] Role selection error:', error);
      console.error('[RoleSelection] Error response:', error.response?.data);
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary-500 rounded-full mb-3 sm:mb-4">
            <span className="text-white font-bold text-xl sm:text-2xl">Q</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 px-2">
            Welcome, {user?.name?.split(' ')[0] || user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Choose your role to get started
          </p>
        </div>

        {/* Role Selection */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Teacher Card */}
            <div
              onClick={() => !loading && handleRoleSelect('teacher')}
              className={`relative rounded-xl sm:rounded-2xl p-6 sm:p-8 transition-all cursor-pointer touch-manipulation active:scale-95 ${
                selectedRole === 'teacher'
                  ? 'bg-primary-500 text-white ring-2 sm:ring-4 ring-primary-200 dark:ring-primary-800'
                  : 'bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-dark-800 hover:border-primary-500'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">👨‍🏫</div>
                <h3 className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 ${
                  selectedRole === 'teacher' ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  Teacher
                </h3>
                <p className={`text-xs sm:text-sm ${
                  selectedRole === 'teacher' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Create and manage exams
                </p>
              </div>
              {selectedRole === 'teacher' && (
                <svg className="absolute top-3 right-3 h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Student Card */}
            <div
              onClick={() => !loading && handleRoleSelect('student')}
              className={`relative rounded-xl sm:rounded-2xl p-6 sm:p-8 transition-all cursor-pointer touch-manipulation active:scale-95 ${
                selectedRole === 'student'
                  ? 'bg-primary-500 text-white ring-2 sm:ring-4 ring-primary-200 dark:ring-primary-800'
                  : 'bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-dark-800 hover:border-primary-500'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">🎓</div>
                <h3 className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 ${
                  selectedRole === 'student' ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  Student
                </h3>
                <p className={`text-xs sm:text-sm ${
                  selectedRole === 'student' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Take exams and view results
                </p>
              </div>
              {selectedRole === 'student' && (
                <svg className="absolute top-3 right-3 h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>

          {/* Additional Information Form */}
          {selectedRole && (
            <div className="bg-white dark:bg-dark-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-dark-800 p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Additional Information (Optional)
              </h4>
              
              {selectedRole === 'teacher' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={additionalInfo.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-dark-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white transition-all"
                  />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      name="rollNumber"
                      value={additionalInfo.rollNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 2021001"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-dark-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                        Class
                      </label>
                      <input
                        type="text"
                        name="class"
                        value={additionalInfo.class}
                        onChange={handleInputChange}
                        placeholder="e.g., CSE-A"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-dark-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                        Semester
                      </label>
                      <input
                        type="text"
                        name="semester"
                        value={additionalInfo.semester}
                        onChange={handleInputChange}
                        placeholder="e.g., 5"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-dark-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white transition-all"
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
            className={`w-full py-3 sm:py-4 px-6 rounded-full font-semibold text-sm sm:text-base transition-all touch-manipulation ${
              selectedRole && !loading
                ? 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-dark-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Setting up...' : 'Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelection;
