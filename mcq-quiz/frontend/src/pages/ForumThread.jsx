import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const ForumThread = () => {
    const { id } = useParams();
    const [forum, setForum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // Track which reply is being replied to
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

    useEffect(() => {
        fetchForum();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchForum = async () => {
        try {
            setLoading(true);
            console.log(`🔍 Fetching forum: ${id}`);
            const response = await axios.get(`${API_URL}/api/forums/${id}`);
            console.log('📥 Received forum data:', response.data.forum);
            console.log(`👁️ Views count: ${response.data.forum.views}`);
            setForum(response.data.forum);
        } catch (error) {
            console.error('Error fetching forum:', error);
            toast.error('Failed to load discussion');
            navigate('/forums');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!token) {
            toast.error('Please login to like posts');
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/api/forums/${id}/like`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                fetchForum();
            }
        } catch (error) {
            console.error('Error liking post:', error);
            toast.error('Failed to like post');
        }
    };

    const handleReplyLike = async (replyId) => {
        if (!token) {
            toast.error('Please login to like replies');
            return;
        }

        try {
            await axios.post(
                `${API_URL}/api/forums/${id}/reply/${replyId}/like`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchForum();
        } catch (error) {
            console.error('Error liking reply:', error);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error('Please login to reply');
            return;
        }

        if (!replyContent.trim()) {
            toast.error('Reply cannot be empty');
            return;
        }

        try {
            setSubmitting(true);
            const response = await axios.post(
                `${API_URL}/api/forums/${id}/reply`,
                { 
                    content: replyContent,
                    parentReplyId: replyingTo?._id || null // Include parent reply ID if replying to a reply
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Reply posted successfully!');
                setReplyContent('');
                setReplyingTo(null); // Clear replying state
                fetchForum();
            }
        } catch (error) {
            console.error('Error posting reply:', error);
            toast.error(error.response?.data?.message || 'Failed to post reply');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkBestAnswer = async (replyId) => {
        if (!token) return;

        try {
            await axios.put(
                `${API_URL}/api/forums/${id}/reply/${replyId}/best-answer`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Marked as best answer!');
            fetchForum();
        } catch (error) {
            console.error('Error marking best answer:', error);
            toast.error(error.response?.data?.message || 'Failed to mark best answer');
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleString();
    };

    // Organize replies into tree structure
    const organizeReplies = (replies) => {
        const replyMap = new Map();
        const rootReplies = [];

        // First pass: create a map of all replies
        replies.forEach(reply => {
            replyMap.set(reply._id, { ...reply, children: [], parentReplyData: null });
        });

        // Second pass: organize into tree and add parent data
        replies.forEach(reply => {
            const replyNode = replyMap.get(reply._id);
            if (reply.parentReply) {
                const parent = replyMap.get(reply.parentReply);
                if (parent) {
                    replyNode.parentReplyData = parent; // Store parent data
                    parent.children.push(replyNode);
                } else {
                    // If parent not found, treat as root level
                    rootReplies.push(replyNode);
                }
            } else {
                // Top-level reply
                rootReplies.push(replyNode);
            }
        });

        return rootReplies;
    };

    // Render a single reply (recursive for nested replies)
    const renderReply = (reply, index, depth = 0) => {
        const isNested = depth > 0;
        
        return (
            <div
                key={reply._id}
                className={`relative ${isNested ? `ml-4 sm:ml-8 mt-4` : ''}`}
                style={{ borderLeftWidth: isNested ? '3px' : '0', borderLeftColor: isNested ? 'rgb(147 197 253)' : 'transparent' }}
            >
                <div
                    className={`relative ${
                        reply.isBestAnswer
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-6 shadow-lg'
                            : 'border-l-4 border-gray-200 dark:border-dark-600 pl-6 hover:border-primary-400 dark:hover:border-primary-600 transition-colors duration-300'
                    }`}
                >
                    {/* Best Answer Badge */}
                    {reply.isBestAnswer && (
                        <div className="absolute -top-3 left-4">
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Best Answer
                            </span>
                        </div>
                    )}

                    {/* Replying To Indicator (for nested replies) */}
                    {reply.parentReplyData && (
                        <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-400 dark:border-blue-600 rounded-r-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                                    Replying to <span className="text-blue-700 dark:text-blue-300 font-bold">@{reply.parentReplyData.user.name}</span>
                                </span>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 pl-6">
                                {reply.parentReplyData.content}
                            </p>
                        </div>
                    )}

                    {/* Reply Header */}
                    <div className="flex items-start justify-between mb-4 gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {reply.user.profileImage ? (
                                <img
                                    src={reply.user.profileImage}
                                    alt={reply.user.name}
                                    className={`${isNested ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl object-cover ring-2 ring-gray-100 dark:ring-dark-700 flex-shrink-0`}
                                />
                            ) : (
                                <div className={`${isNested ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white ${isNested ? 'text-base' : 'text-lg'} font-bold ring-2 ring-gray-100 dark:ring-dark-700 flex-shrink-0`}>
                                    {reply.user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <p className="font-bold text-gray-900 dark:text-white truncate">
                                        {reply.user.name}
                                    </p>
                                    {reply.user.role === 'teacher' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                            </svg>
                                            Teacher
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatTime(reply.createdAt)}
                                </p>
                            </div>
                        </div>

                        {/* Mark as best answer (author only) */}
                        {isAuthor && !reply.isBestAnswer && !forum.isSolved && (
                            <button
                                onClick={() => handleMarkBestAnswer(reply._id)}
                                className="flex-shrink-0 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 dark:hover:from-green-900/50 dark:hover:to-emerald-900/50 transition-all duration-300 border border-green-300 dark:border-green-800 shadow-md hover:shadow-lg"
                            >
                                <span className="hidden sm:inline">Mark as Best Answer</span>
                                <span className="sm:hidden">✓ Best</span>
                            </button>
                        )}
                    </div>

                    {/* Reply Content */}
                    <p className="text-base text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
                        {reply.content}
                    </p>

                    {/* Reply Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={() => handleReplyLike(reply._id)}
                            disabled={!token}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                reply.likes.includes(user?._id)
                                    ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-600 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    : 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600 border border-gray-200 dark:border-dark-600'
                            } ${!token && 'opacity-50 cursor-not-allowed'}`}
                        >
                            <span className="text-base">{reply.likes.includes(user?._id) ? '❤️' : '🤍'}</span>
                            <span className="font-semibold">{reply.likes.length}</span>
                            <span className="hidden sm:inline">Likes</span>
                        </button>

                        {/* Reply Button */}
                        {token && !forum.isClosed && (
                            <button
                                onClick={() => setReplyingTo(reply)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 hover:from-blue-200 hover:to-indigo-200 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 border border-blue-200 dark:border-blue-800 transition-all duration-300"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Reply
                            </button>
                        )}
                    </div>

                    {/* Reply Number Badge (only for top-level) */}
                    {!isNested && (
                        <div className="absolute -left-3 top-0 w-6 h-6 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                            {index + 1}
                        </div>
                    )}
                </div>

                {/* Render nested replies */}
                {reply.children && reply.children.length > 0 && (
                    <div className="mt-4">
                        {reply.children.map((childReply, childIndex) => 
                            renderReply(childReply, childIndex, depth + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-dark-950 dark:via-dark-950 dark:to-dark-900 flex flex-col items-center justify-center p-4">
                <Loading />
                <p className="mt-6 text-gray-600 dark:text-gray-400 text-lg animate-pulse">Loading discussion...</p>
            </div>
        );
    }

    if (!forum) return null;

    const isAuthor = user?._id === forum.author._id;
    const userLiked = forum.likes.includes(user?._id);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-dark-950 dark:via-dark-950 dark:to-dark-900 py-6 sm:py-8 lg:py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button - Enhanced */}
                <button
                    onClick={() => navigate('/forums')}
                    className="mb-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-dark-700 transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200 dark:border-dark-700 group"
                >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium">Back to Forums</span>
                </button>

                {/* Main Post Card - Professional Design */}
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-700 overflow-hidden mb-8 animate-fadeIn">
                    {/* Color Accent Bar */}
                    <div className={`h-2 ${
                        forum.isSolved ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500' :
                        forum.isPinned ? 'bg-gradient-to-r from-orange-400 via-red-500 to-pink-500' :
                        'bg-gradient-to-r from-primary-400 via-purple-500 to-pink-500'
                    }`}></div>

                    <div className="p-6 sm:p-8">
                        {/* Author Info and Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                {forum.author.profileImage ? (
                                    <img
                                        src={forum.author.profileImage}
                                        alt={forum.author.name}
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-4 ring-gray-100 dark:ring-dark-700 shadow-lg"
                                    />
                                ) : (
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ring-4 ring-gray-100 dark:ring-dark-700 shadow-lg">
                                        {forum.author.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-lg text-gray-900 dark:text-white">
                                            {forum.author.name}
                                        </p>
                                        {forum.author.role === 'teacher' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                                </svg>
                                                Teacher
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formatTime(forum.createdAt)}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2">
                                {forum.isPinned && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 dark:from-orange-900/50 dark:to-red-900/50 dark:text-orange-200 border border-orange-200 dark:border-orange-800">
                                        <span className="text-base">📌</span>
                                        Pinned
                                    </span>
                                )}
                                {forum.isSolved && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/50 dark:to-emerald-900/50 dark:text-green-200 border border-green-200 dark:border-green-800">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Solved
                                    </span>
                                )}
                                {forum.isClosed && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-800 dark:from-red-900/50 dark:to-rose-900/50 dark:text-red-200 border border-red-200 dark:border-red-800">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        Closed
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                            {forum.title}
                        </h1>

                        {/* Tags and Subject */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-primary-100 to-purple-100 text-primary-800 dark:from-primary-900/50 dark:to-purple-900/50 dark:text-primary-200 border border-primary-200 dark:border-primary-800">
                                <span>📚</span>
                                {forum.subject}
                            </span>
                            {forum.tags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300 border border-gray-200 dark:border-dark-600"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="prose dark:prose-invert max-w-none mb-6">
                            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {forum.content}
                            </p>
                        </div>

                        {/* Actions Bar */}
                        <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-200 dark:border-dark-700">
                            <button
                                onClick={handleLike}
                                disabled={!token}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg ${
                                    userLiked
                                        ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-600 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                                        : 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600 border border-gray-200 dark:border-dark-600'
                                } ${!token && 'opacity-50 cursor-not-allowed'}`}
                            >
                                <span className="text-lg">{userLiked ? '❤️' : '🤍'}</span>
                                <span className="font-semibold">{forum.likes.length}</span>
                                <span className="hidden sm:inline">Likes</span>
                            </button>

                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">💬</span>
                                    <span className="font-semibold">{forum.replies.length}</span>
                                    <span className="hidden sm:inline">Replies</span>
                                </div>
                                <div className="w-px h-6 bg-gray-300 dark:bg-dark-600"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">👁️</span>
                                    <span className="font-semibold">{forum.views}</span>
                                    <span className="hidden sm:inline">Views</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Replies Section - Enhanced Design */}
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                    {/* Section Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-dark-700 dark:to-dark-700 px-6 sm:px-8 py-5 border-b border-gray-200 dark:border-dark-600">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl">💬</span>
                            </div>
                            <span>Replies</span>
                            <span className="text-lg text-gray-500 dark:text-gray-400">({forum.replies.length})</span>
                        </h2>
                    </div>

                    <div className="p-6 sm:p-8">
                        {/* Reply Form */}
                        {!forum.isClosed ? (
                            token ? (
                                <form onSubmit={handleReplySubmit} className="mb-8">
                                    {/* Replying To Indicator */}
                                    {replyingTo && (
                                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                    </svg>
                                                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-200 truncate">
                                                        Replying to <span className="text-blue-700 dark:text-blue-300">@{replyingTo.user.name}</span>
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setReplyingTo(null)}
                                                    className="flex-shrink-0 p-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors duration-200"
                                                    title="Cancel reply"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2 pl-7">
                                                {replyingTo.content}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <span className="text-lg">✍️</span>
                                        Your Reply
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            rows={5}
                                            placeholder="Share your thoughts, provide an answer, or ask for clarification..."
                                            className="input w-full resize-none text-base"
                                            required
                                            maxLength={2000}
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {replyContent.length}/2000 characters
                                        </p>
                                    </div>
                                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                        <button
                                            type="submit"
                                            disabled={submitting || !replyContent.trim()}
                                            className="btn-primary px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {submitting ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Posting...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                    </svg>
                                                    {replyingTo ? 'Post Reply to User' : 'Post Reply'}
                                                </>
                                            )}
                                        </button>
                                        {replyingTo && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReplyingTo(null);
                                                    setReplyContent('');
                                                }}
                                                className="btn-secondary px-6 py-3 font-semibold"
                                            >
                                                Cancel Reply
                                            </button>
                                        )}
                                        {!replyingTo && replyContent && (
                                            <button
                                                type="button"
                                                onClick={() => setReplyContent('')}
                                                className="btn-secondary px-6 py-3 font-semibold"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </form>
                            ) : (
                                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl text-center">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <p className="text-blue-900 dark:text-blue-200 font-semibold mb-2">
                                        Please login to reply
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Join the conversation by logging into your account
                                    </p>
                                </div>
                            )
                        ) : (
                            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl flex items-start gap-4">
                                <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="font-bold text-yellow-900 dark:text-yellow-200 mb-1">
                                        This discussion is closed
                                    </p>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                        This discussion is no longer accepting new replies.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Replies List */}
                        <div className="space-y-6">
                            {forum.replies.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-full mb-4">
                                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No replies yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">Be the first to share your thoughts!</p>
                                </div>
                            ) : (
                                organizeReplies(forum.replies).map((reply, index) => 
                                    renderReply(reply, index, 0)
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForumThread;
