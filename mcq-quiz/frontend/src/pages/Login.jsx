import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from '../components/Loading.jsx';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setErrors({ submit: result.message });
      setLoading(false);
    }
  };

  const fillDemoCredentials = (type) => {
    if (type === 'teacher') {
      setFormData({ email: 'teacher@demo.com', password: 'password123' });
    } else {
      setFormData({ email: 'student@demo.com', password: 'password123' });
    }
    setErrors({});
  };

  if (loading) {
    return <Loading fullScreen text="Signing you in..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-dark-950 dark:via-dark-925 dark:to-dark-900 py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-md w-full space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-glow transform hover:scale-110 transition-transform duration-300">
            <span className="text-white font-bold text-lg sm:text-xl md:text-2xl">M</span>
          </div>
          <h2 className="mt-4 sm:mt-5 md:mt-6 text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Welcome Back!
          </h2>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            Sign in to access your exam portal
          </p>
        </div>

        {/* Form */}
        <form className="mt-4 sm:mt-6 md:mt-8 space-y-4 sm:space-y-5 md:space-y-6 bg-white/90 dark:bg-dark-850/90 backdrop-blur-xl p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-dark-700" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 sm:p-4 rounded animate-fadeIn" role="alert">
              <div className="flex">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">{errors.submit}</p>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-8 sm:pl-10 pr-2.5 sm:pr-3 py-2 sm:py-2.5 md:py-3 border rounded-md sm:rounded-lg text-sm sm:text-base leading-5 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-dark-600 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                  placeholder="you@example.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400 animate-fadeIn" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-8 sm:pl-10 pr-9 sm:pr-12 py-2 sm:py-2.5 md:py-3 border rounded-md sm:rounded-lg text-sm sm:text-base leading-5 bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-dark-600 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                  placeholder="Enter your password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400 animate-fadeIn" role="alert">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 border border-transparent rounded-md sm:rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg p-4 sm:p-5 md:p-6">
          <h3 className="text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
            🎯 Quick Demo Access
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => fillDemoCredentials('teacher')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-700 rounded-md sm:rounded-lg p-2.5 sm:p-3 hover:shadow-md transform hover:scale-105 transition-all duration-200"
            >
              <p className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200">👨‍🏫 Teacher</p>
              <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-300 mt-0.5 sm:mt-1">Click to autofill</p>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('student')}
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-300 dark:border-green-700 rounded-md sm:rounded-lg p-2.5 sm:p-3 hover:shadow-md transform hover:scale-105 transition-all duration-200"
            >
              <p className="text-xs sm:text-sm font-semibold text-green-800 dark:text-green-200">🎓 Student</p>
              <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-300 mt-0.5 sm:mt-1">Click to autofill</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Login);
