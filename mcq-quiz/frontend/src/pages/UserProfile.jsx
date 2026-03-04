import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const UserProfile = () => {
    const { userId } = useParams();
    const [profile, setProfile] = useState(null);
    const [forums, setForums] = useState([]);
    const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0, totalReplies: 0 });
    const [loading, setLoading] = useState(true);
    const { user: currentUser, token } = useAuth();
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        subject: '',
        tags: ''
    });

    const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

    useEffect(() => {
        fetchUserProfile();
        fetchSubjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/auth/user/${userId}`);
            setProfile(response.data.user);
            setForums(response.data.forums);
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            toast.error('Failed to load user profile');
            navigate('/forums');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/forums/subjects/list`);
            setSubjects(response.data.subjects || []);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        
        if (!token) {
            toast.error('Please login to create a post');
            return;
        }

        try {
            const tagsArray = newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            
            const response = await axios.post(
                `${API_URL}/api/forums`,
                {
                    title: newPost.title,
                    content: newPost.content,
                    subject: newPost.subject,
                    tags: tagsArray
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Forum post created successfully!');
                setShowCreateModal(false);
                setNewPost({ title: '', content: '', subject: '', tags: '' });
                fetchUserProfile();
            }
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error(error.response?.data?.message || 'Failed to create post');
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const then = new Date(date);
        const seconds = Math.floor((now - then) / 1000);
        
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        
        return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatJoinDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (!profile) return null;

    const isOwnProfile = currentUser?._id === profile._id;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
            <div className="max-w-2xl mx-auto bg-white dark:bg-dark-900 min-h-screen border-x border-gray-200 dark:border-dark-800">
                {/* Twitter-style Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-800">
                    <div className="px-4 py-3 flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="hover:bg-gray-100 dark:hover:bg-dark-800 p-2 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalPosts} posts</p>
                        </div>
                        {isOwnProfile && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-primary-500 hover:bg-primary-600 text-white rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200"
                            >
                                Post
                            </button>
                        )}
                    </div>
                </div>

                {/* Profile Section */}
                <div className="border-b-8 border-gray-200 dark:border-dark-800">
                    {/* Cover Image Placeholder */}
                    <div className="h-32 sm:h-48 bg-gradient-to-r from-primary-400 to-purple-500"></div>
                    
                    <div className="px-4 pb-4">
                        {/* Avatar */}
                        <div className="flex justify-between items-start -mt-16 sm:-mt-20 mb-3">
                            {profile.profileImage ? (
                                <img
                                    src={profile.profileImage}
                                    alt={profile.name}
                                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-dark-900"
                                />
                            ) : (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl sm:text-5xl font-bold border-4 border-white dark:border-dark-900">
                                    {profile.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            
                            {isOwnProfile && (
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="mt-3 px-4 py-2 rounded-full border border-gray-300 dark:border-dark-700 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                                >
                                    Edit profile
                                </button>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                                {profile.role === 'teacher' && (
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">@{profile.email.split('@')[0]}</p>

                            {/* Role Badge */}
                            <div className="flex gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                    profile.role === 'teacher' 
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                }`}>
                                    {profile.role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
                                </span>
                                {profile.department && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300">
                                        📚 {profile.department}
                                    </span>
                                )}
                            </div>

                            {/* Additional Info */}
                            {profile.role === 'student' && (
                                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {profile.rollNumber && <span>Roll: {profile.rollNumber}</span>}
                                    {profile.class && <span>• Class: {profile.class}</span>}
                                    {profile.semester && <span>• Semester: {profile.semester}</span>}
                                </div>
                            )}

                            {/* Join Date */}
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mb-3">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Joined {formatJoinDate(profile.createdAt)}</span>
                            </div>

                            {/* Social Links */}
                            {(profile.linkedin || profile.github || profile.leetcode) && (
                                <div className="flex gap-3">
                                    {profile.linkedin && (
                                        <a
                                            href={profile.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                                            </svg>
                                            LinkedIn
                                        </a>
                                    )}
                                    {profile.github && (
                                        <a
                                            href={profile.github}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-900 dark:text-white hover:underline text-sm flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                            </svg>
                                            GitHub
                                        </a>
                                    )}
                                    {profile.leetcode && (
                                        <a
                                            href={profile.leetcode}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-orange-600 hover:underline text-sm flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                            </svg>
                                            LeetCode
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 text-sm">
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white">{stats.totalPosts}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">Posts</span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white">{stats.totalLikes}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">Likes</span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white">{stats.totalReplies}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">Replies</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts Section */}
                <div>
                    <div className="border-b border-gray-200 dark:border-dark-800">
                        <div className="px-4 py-3">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Posts</h3>
                        </div>
                    </div>

                    {forums.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {isOwnProfile ? "You haven't posted anything yet" : `${profile.name} hasn't posted anything yet`}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-dark-800">
                            {forums.map((forum) => (
                                <Link
                                    key={forum._id}
                                    to={`/forums/${forum._id}`}
                                    className="block hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors duration-200"
                                >
                                    <div className="px-4 py-3">
                                        <div className="flex gap-3">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                {profile.profileImage ? (
                                                    <img
                                                        src={profile.profileImage}
                                                        alt={profile.name}
                                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-base font-bold">
                                                        {profile.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                                        {profile.name}
                                                    </span>
                                                    {profile.role === 'teacher' && (
                                                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    <span className="text-gray-500 dark:text-gray-400 text-sm">·</span>
                                                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                                                        {formatTime(forum.createdAt)}
                                                    </span>
                                                </div>

                                                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                                                    {forum.title}
                                                </h3>

                                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-3 leading-relaxed">
                                                    {forum.content}
                                                </p>

                                                <div className="mb-2">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                                        <span>📚</span>
                                                        {forum.subject}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                        <span className="font-medium">{forum.replies.length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                        <span className="font-medium">{forum.likes.length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        <span className="font-medium">{forum.views}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Twitter-style Create Post Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-12">
                        <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Simple Header */}
                            <div className="sticky top-0 bg-white dark:bg-dark-900 px-4 py-3 border-b border-gray-200 dark:border-dark-800 flex items-center justify-between">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 p-2 rounded-full transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <button 
                                    type="submit" 
                                    form="create-post-form"
                                    className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
                                    disabled={!newPost.title || !newPost.subject || !newPost.content}
                                >
                                    Post
                                </button>
                            </div>

                            <form id="create-post-form" onSubmit={handleCreatePost} className="p-4">
                                {/* Content Areas - Minimal Styling */}
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        required
                                        value={newPost.title}
                                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                        className="w-full border-0 text-xl font-semibold text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none bg-transparent"
                                        placeholder="What's happening?"
                                        maxLength={200}
                                    />
                                    
                                    <textarea
                                        required
                                        rows={6}
                                        value={newPost.content}
                                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                        className="w-full border-0 text-base text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none resize-none bg-transparent"
                                        placeholder="Add more details..."
                                        maxLength={5000}
                                    />

                                    {/* Subject & Tags Row */}
                                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-dark-800">
                                        <input
                                            type="text"
                                            required
                                            value={newPost.subject}
                                            onChange={(e) => setNewPost({ ...newPost, subject: e.target.value })}
                                            className="flex-1 border border-gray-300 dark:border-dark-700 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-transparent"
                                            placeholder="Subject"
                                            list="subjects-list"
                                        />
                                        <datalist id="subjects-list">
                                            {subjects.map((subject) => (
                                                <option key={subject} value={subject} />
                                            ))}
                                        </datalist>
                                        
                                        <input
                                            type="text"
                                            value={newPost.tags}
                                            onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                                            className="flex-1 border border-gray-300 dark:border-dark-700 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-transparent"
                                            placeholder="Tags (comma-separated)"
                                        />
                                    </div>

                                    {/* Character Count */}
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-2">
                                        <span>Title: {newPost.title.length}/200</span>
                                        <span>Content: {newPost.content.length}/5000</span>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
