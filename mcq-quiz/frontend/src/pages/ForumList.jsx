import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const ForumList = () => {
    const [forums, setForums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortBy, setSortBy] = useState('recent');
    const { token } = useAuth();

    const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        subject: '',
        tags: ''
    });

    useEffect(() => {
        fetchForums();
        fetchSubjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubject, searchQuery]);

    const fetchForums = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedSubject) params.subject = selectedSubject;
            if (searchQuery) params.search = searchQuery;

            const response = await axios.get(`${API_URL}/api/forums`, { params });
            setForums(response.data.forums || []);
        } catch (error) {
            console.error('Error fetching forums:', error);
            toast.error('Failed to load forums');
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
                fetchForums();
            }
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error(error.response?.data?.message || 'Failed to create post');
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diffMs = now - postDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return postDate.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-dark-950 dark:via-dark-950 dark:to-dark-900 py-6 sm:py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section - Enhanced with gradient */}
                <div className="mb-8 sm:mb-12">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl shadow-lg mb-4 animate-fadeIn">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-primary-800 to-purple-900 dark:from-white dark:via-primary-300 dark:to-purple-300 bg-clip-text text-transparent mb-3 animate-fadeIn">
                            Discussion Forums
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-fadeIn">
                            Connect, collaborate, and learn together with our community
                        </p>
                    </div>

                    {/* Stats Cards - Mobile Responsive */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
                        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 sm:p-6 border border-gray-100 dark:border-dark-700 hover:scale-105">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl">💬</span>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Posts</p>
                                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{forums.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 sm:p-6 border border-gray-100 dark:border-dark-700 hover:scale-105">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl">✓</span>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Solved</p>
                                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{forums.filter(f => f.isSolved).length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 sm:p-6 border border-gray-100 dark:border-dark-700 hover:scale-105">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl">📚</span>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Subjects</p>
                                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{subjects.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 sm:p-6 border border-gray-100 dark:border-dark-700 hover:scale-105">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl">📌</span>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pinned</p>
                                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{forums.filter(f => f.isPinned).length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Actions - Enhanced Mobile UI */}
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg border border-gray-100 dark:border-dark-700 p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* Search - Full width on mobile */}
                        <div className="sm:col-span-2 lg:col-span-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search discussions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input pl-10 w-full"
                                />
                            </div>
                        </div>

                        {/* Subject Filter */}
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="input w-full"
                        >
                            <option value="">📚 All Subjects</option>
                            {subjects.map((subject) => (
                                <option key={subject} value={subject}>
                                    {subject}
                                </option>
                            ))}
                        </select>

                        {/* Sort By */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="input w-full"
                        >
                            <option value="recent">🕒 Most Recent</option>
                            <option value="popular">🔥 Most Popular</option>
                            <option value="solved">✓ Solved First</option>
                            <option value="unanswered">❓ Unanswered</option>
                        </select>

                        {/* Create Button - Full width on mobile */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary w-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">New Discussion</span>
                            <span className="sm:hidden">Create Post</span>
                        </button>
                    </div>
                </div>

                {/* Forums List - Enhanced Cards */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-24">
                        <Loading />
                        <p className="mt-4 text-gray-500 dark:text-gray-400 animate-pulse">Loading discussions...</p>
                    </div>
                ) : forums.length === 0 ? (
                    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg border border-gray-100 dark:border-dark-700 p-8 sm:p-16 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-full mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">No discussions found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            {searchQuery || selectedSubject 
                                ? 'Try adjusting your filters or search query' 
                                : 'Be the first to start a discussion!'}
                        </p>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Start a Discussion
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-6">
                        {forums.map((forum) => (
                            <Link
                                key={forum._id}
                                to={`/forums/${forum._id}`}
                                className="block group"
                            >
                                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-dark-700 hover:border-primary-200 dark:hover:border-primary-800 overflow-hidden group-hover:scale-[1.01]">
                                    {/* Color accent bar */}
                                    <div className={`h-1.5 ${
                                        forum.isSolved ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                        forum.isPinned ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                                        'bg-gradient-to-r from-primary-400 to-purple-500'
                                    }`}></div>
                                    
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                            {/* Left: Author Avatar - Hidden on smallest mobile */}
                                            <div className="hidden xs:flex flex-shrink-0">
                                                {forum.author.profileImage ? (
                                                    <img
                                                        src={forum.author.profileImage}
                                                        alt={forum.author.name}
                                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover ring-2 ring-gray-100 dark:ring-dark-700"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold ring-2 ring-gray-100 dark:ring-dark-700">
                                                        {forum.author.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Center: Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Title and Badges */}
                                                <div className="flex flex-wrap items-start gap-2 mb-3">
                                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-1 min-w-0 break-words">
                                                        {forum.isPinned && <span className="text-orange-500 mr-2">📌</span>}
                                                        {forum.title}
                                                    </h3>
                                                </div>

                                                {/* Tags and Subject */}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary-100 to-purple-100 text-primary-800 dark:from-primary-900/50 dark:to-purple-900/50 dark:text-primary-200 border border-primary-200 dark:border-primary-800">
                                                        📚 {forum.subject}
                                                    </span>
                                                    {forum.tags.slice(0, 3).map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 border border-gray-200 dark:border-dark-600"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {forum.tags.length > 3 && (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-gray-400">
                                                            +{forum.tags.length - 3}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Content Preview */}
                                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                                    {forum.content}
                                                </p>

                                                {/* Meta Info - Responsive Grid */}
                                                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <div className="xs:hidden w-6 h-6 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                            {forum.author.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">{forum.author.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-base">💬</span>
                                                        <span className="font-semibold">{forum.replies.length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-base">❤️</span>
                                                        <span className="font-semibold">{forum.likes.length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-base">👁️</span>
                                                        <span className="font-semibold">{forum.views}</span>
                                                    </div>
                                                    <div className="hidden sm:flex items-center gap-1.5">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>{formatTime(forum.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Status Badges - Stacked on mobile */}
                                            <div className="flex sm:flex-col gap-2 flex-wrap sm:flex-nowrap">
                                                {forum.isSolved && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/50 dark:to-emerald-900/50 dark:text-green-200 border border-green-200 dark:border-green-800 whitespace-nowrap">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        Solved
                                                    </span>
                                                )}
                                                {forum.isClosed && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-800 dark:from-red-900/50 dark:to-rose-900/50 dark:text-red-200 border border-red-200 dark:border-red-800 whitespace-nowrap">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                        Closed
                                                    </span>
                                                )}
                                                {!forum.isSolved && forum.replies.length === 0 && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/50 dark:to-amber-900/50 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 whitespace-nowrap">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                        </svg>
                                                        No Replies
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Create Post Modal - Enhanced Mobile Design */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-700 animate-scaleIn">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-5 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Create New Discussion
                                    </h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleCreatePost} className="p-6 space-y-5">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <span className="text-lg">📝</span>
                                        Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newPost.title}
                                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                        className="input w-full text-lg"
                                        placeholder="What's your question or topic?"
                                        maxLength={200}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {newPost.title.length}/200 characters
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <span className="text-lg">📚</span>
                                        Subject <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newPost.subject}
                                        onChange={(e) => setNewPost({ ...newPost, subject: e.target.value })}
                                        className="input w-full"
                                        placeholder="e.g., Mathematics, Physics, Chemistry..."
                                        list="subjects-list"
                                    />
                                    <datalist id="subjects-list">
                                        {subjects.map((subject) => (
                                            <option key={subject} value={subject} />
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <span className="text-lg">✍️</span>
                                        Content <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={8}
                                        value={newPost.content}
                                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                        className="input w-full resize-none"
                                        placeholder="Describe your question or topic in detail... Include any context, examples, or specific points you'd like to discuss."
                                        maxLength={5000}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {newPost.content.length}/5000 characters
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <span className="text-lg">🏷️</span>
                                        Tags (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newPost.tags}
                                        onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                                        className="input w-full"
                                        placeholder="algebra, equations, help, homework (comma-separated)"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Add up to 5 relevant tags to help others find your discussion
                                    </p>
                                </div>

                                {/* Posting Guidelines */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Posting Guidelines
                                    </p>
                                    <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 ml-7">
                                        <li>• Be clear and specific in your title</li>
                                        <li>• Provide enough context in the content</li>
                                        <li>• Use relevant tags for better discoverability</li>
                                        <li>• Be respectful and constructive</li>
                                    </ul>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                                    <button 
                                        type="submit" 
                                        className="btn-primary flex-1 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Create Discussion
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn-secondary flex-1 py-3 font-semibold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForumList;
