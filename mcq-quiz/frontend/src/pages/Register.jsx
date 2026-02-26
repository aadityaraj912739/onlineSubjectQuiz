import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from '../components/Loading.jsx';

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

  const { register } = useAuth();

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950">
        <Loading text="Creating account..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h2 className="mt-6 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Join McqQuiz as a teacher or student
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Register as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${
                  formData.role === 'student' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Student</span>
                </label>
                <label className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all ${
                  formData.role === 'teacher' 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Teacher</span>
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 input-field ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Role-specific fields */}
            {formData.role === 'teacher' ? (
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className={`mt-1 input-field ${errors.department ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="e.g., Computer Science"
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Roll Number
                    </label>
                    <input
                      id="rollNumber"
                      name="rollNumber"
                      type="text"
                      required
                      value={formData.rollNumber}
                      onChange={handleChange}
                      className={`mt-1 input-field ${errors.rollNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="e.g., 2021001"
                    />
                    {errors.rollNumber && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rollNumber}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Class
                    </label>
                    <input
                      id="class"
                      name="class"
                      type="text"
                      required
                      value={formData.class}
                      onChange={handleChange}
                      className={`mt-1 input-field ${errors.class ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="e.g., CSE-A"
                    />
                    {errors.class && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.class}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Semester
                  </label>
                  <input
                    id="semester"
                    name="semester"
                    type="text"
                    required
                    value={formData.semester}
                    onChange={handleChange}
                    className={`mt-1 input-field ${errors.semester ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., 1, 2, 3, etc."
                  />
                  {errors.semester && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.semester}</p>
                  )}
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                className={`mt-1 input-field ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                className={`mt-1 input-field ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-medium"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;