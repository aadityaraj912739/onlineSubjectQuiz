import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from '../components/Loading.jsx';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    // Teacher fields
    department: '',
    // Student fields
    rollNumber: '',
    class: '',
    semester: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register, googleLogin } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validation
    if (formData.role === 'teacher') {
      if (!formData.department.trim()) {
        newErrors.department = 'Department is required for teachers';
      }
    } else if (formData.role === 'student') {
      if (!formData.rollNumber.trim()) {
        newErrors.rollNumber = 'Roll number is required for students';
      }
      if (!formData.class.trim()) {
        newErrors.class = 'Class is required for students';
      }
      if (!formData.semester.trim()) {
        newErrors.semester = 'Semester is required for students';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    const result = await register(formData);
    
    if (!result.success) {
      setErrors({ submit: result.message });
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    const result = await googleLogin(credentialResponse.credential);
    
    if (!result.success) {
      setErrors({ submit: result.message });
      setLoading(false);
    }
    // If successful, navigation will be handled by AuthContext
  };

  const handleGoogleError = () => {
    toast.error('Google sign up failed. Please try again.');
    setErrors({ submit: 'Google sign up failed. Please try again.' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950">
        <Loading text="Creating account..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary-500 rounded-full mb-3 sm:mb-4">
            <span className="text-white font-bold text-xl sm:text-2xl">Q</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 px-2">
            Create your account
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Join Quiz Platform
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-dark-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-dark-800 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-400">{errors.submit}</p>
              </div>
            )}
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <label className={`cursor-pointer rounded-lg border-2 p-3 sm:p-4 text-center transition-all touch-manipulation active:scale-95 ${
                  formData.role === 'student' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-300 dark:border-dark-700 hover:border-primary-300 dark:hover:border-dark-600'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">🎓</div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Student</span>
                </label>
                <label className={`cursor-pointer rounded-lg border-2 p-3 sm:p-4 text-center transition-all touch-manipulation active:scale-95 ${
                  formData.role === 'teacher' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-300 dark:border-dark-700 hover:border-primary-300 dark:hover:border-dark-600'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">👨‍🏫</div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Teacher</span>
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-dark-700'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-dark-700'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Role-specific fields */}
            {formData.role === 'teacher' ? (
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Department
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.department ? 'border-red-500' : 'border-gray-300 dark:border-dark-700'
                  }`}
                  placeholder="e.g., Computer Science"
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Roll Number
                  </label>
                  <input
                    id="rollNumber"
                    name="rollNumber"
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                      errors.rollNumber ? 'border-red-500' : 'border-gray-300 dark:border-dark-700'
                    }`}
                    placeholder="e.g., 2021001"
                  />
                  {errors.rollNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rollNumber}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Class
                    </label>
                    <input
                      id="class"
                      name="class"
                      type="text"
                      required
                      value={formData.class}
                      onChange={handleChange}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.class ? 'border-red-500' : 'border-gray-300 dark:border-dark-700'
                      }`}
                      placeholder="CSE-A"
                    />
                    {errors.class && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.class}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Semester
                    </label>
                    <input
                      id="semester"
                      name="semester"
                      type="text"
                      required
                      value={formData.semester}
                      onChange={handleChange}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                        errors.semester ? 'border-red-500' : 'border-gray-300 dark:border-dark-700'
                      }`}
                      placeholder="1, 2, 3..."
                    />
                    {errors.semester && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.semester}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-dark-700'
                }`}
                placeholder="Create a password (min 6 characters)"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-dark-700'
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 px-4 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white rounded-full font-semibold text-sm sm:text-base transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-dark-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-dark-900 text-gray-500 dark:text-gray-400">
                Or
              </span>
            </div>
          </div>

          {/* Google Sign Up Button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
            />
          </div>
        </form>

        {/* Sign in link */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700">
          <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Register;