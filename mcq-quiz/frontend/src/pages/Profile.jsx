import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FaUser, FaEnvelope, FaBuilding, FaHashtag, FaChalkboardTeacher, FaCamera, FaLinkedin, FaGithub, FaTrash } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import Loading from '../components/Loading.jsx';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, loading, api } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    rollNumber: '',
    class: '',
    semester: '',
    country: '',
    state: '',
    college: '',
    branch: '',
    linkedin: '',
    leetcode: '',
    github: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        rollNumber: user.rollNumber || '',
        class: user.class || '',
        semester: user.semester || '',
        country: user.country || '',
        state: user.state || '',
        college: user.college || '',
        branch: user.branch || '',
        linkedin: user.linkedin || '',
        leetcode: user.leetcode || '',
        github: user.github || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const profileData = {
      name: formData.name,
      country: formData.country,
      state: formData.state,
      college: formData.college,
      branch: formData.branch,
      linkedin: formData.linkedin,
      leetcode: formData.leetcode,
      github: formData.github,
    };
    if (user.role === 'teacher') {
      profileData.department = formData.department;
    }
    if (user.role === 'student') {
      profileData.rollNumber = formData.rollNumber;
      profileData.class = formData.class;
      profileData.semester = formData.semester;
    }
    await updateProfile(profileData);
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await api.post('/auth/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user context with new profile image
      const updatedUser = { ...user, profileImage: response.data.profileImage };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload(); // Reload to update all components

      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!user.profileImage) {
      toast.error('No profile picture to delete');
      return;
    }

    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setUploading(true);

    try {
      await api.delete('/auth/delete-profile-picture');

      // Update user context
      const updatedUser = { ...user, profileImage: '' };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload(); // Reload to update all components

      toast.success('Profile picture deleted successfully!');
    } catch (error) {
      console.error('Profile picture deletion error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete profile picture');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please log in to see your profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-900 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="w-full md:w-1/3 bg-gray-50 dark:bg-dark-700 p-6 md:p-8 flex flex-col items-center justify-center">
              <div className="relative">
                <img
                  className="w-24 md:w-32 h-24 md:h-32 rounded-full object-cover shadow-md ring-4 ring-white dark:ring-dark-600"
                  src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                  alt="Profile"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePictureChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleProfilePictureClick}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 text-white hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
                  title="Upload profile picture"
                >
                  {uploading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <FaCamera />
                  )}
                </button>
                {user.profileImage && (
                  <button
                    type="button"
                    onClick={handleDeleteProfilePicture}
                    disabled={uploading}
                    className="absolute top-0 right-0 bg-red-600 rounded-full p-2 text-white hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
                    title="Delete profile picture"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                )}
              </div>
              <h2 className="mt-4 text-lg md:text-xl font-semibold text-gray-800 dark:text-white">{user.name}</h2>
              <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{user.role}</span>
              <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                Click camera icon to upload<br />JPG, PNG, GIF (max 5MB)
              </p>
            </div>
            <div className="w-full md:w-2/3 p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
                Edit Profile
              </h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <FaUser className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <FaEnvelope className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    placeholder="Email"
                    className="pl-12 w-full border-gray-300 rounded-lg shadow-sm bg-gray-100 dark:bg-dark-600 dark:border-dark-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                {/* Common Location & Academic Fields */}
                <div className="border-t border-gray-200 dark:border-dark-600 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Location & Academic Details</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <FaBuilding className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="Country"
                        className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                      />
                    </div>
                    <div className="relative">
                      <FaBuilding className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State/Province"
                        className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                      />
                    </div>
                    <div className="relative">
                      <FaBuilding className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                      <input
                        type="text"
                        name="college"
                        value={formData.college}
                        onChange={handleChange}
                        placeholder="College/University Name"
                        className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                      />
                    </div>
                    <div className="relative">
                      <FaChalkboardTeacher className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        placeholder={user.role === 'teacher' ? 'Branch/Department' : 'Branch (e.g., CS, IT, ECE)'}
                        className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {user.role === 'teacher' && (
                  <div className="relative">
                    <FaBuilding className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="Department"
                      className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                    />
                  </div>
                )}

                {user.role === 'student' && (
                  <>
                    <div className="relative">
                      <FaHashtag className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                      <input
                        type="text"
                        name="rollNumber"
                        value={formData.rollNumber}
                        onChange={handleChange}
                        placeholder="Roll Number"
                        className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                      />
                    </div>
                    <div className="relative">
                      <FaChalkboardTeacher className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                      <input
                        type="text"
                        name="class"
                        value={formData.class}
                        onChange={handleChange}
                        placeholder="Class"
                        className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                      />
                    </div>
                    <div className="relative">
                      <FaChalkboardTeacher className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                      <input
                        type="text"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        placeholder="Semester (e.g., 1, 2, 3, 4)"
                        className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {/* Social Links */}
                <div className="relative">
                  <FaLinkedin className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                  <input
                    type="text"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="LinkedIn Profile URL"
                    className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <SiLeetcode className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                  <input
                    type="text"
                    name="leetcode"
                    value={formData.leetcode}
                    onChange={handleChange}
                    placeholder="LeetCode Profile URL"
                    className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <FaGithub className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                  <input
                    type="text"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="GitHub Profile URL"
                    className="pl-12 w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  />
                </div>


                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-dark-800 transition-transform transform hover:scale-105"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;