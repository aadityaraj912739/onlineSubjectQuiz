import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const ForumThread = () => {
    const { id } = useParams();
    const [forum, setForum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [replyImage, setReplyImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // Track which reply is being replied to
    const [expandedReplies, setExpandedReplies] = useState(new Set()); // Track which replies are expanded
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

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            setReplyImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setReplyImage(null);
        setImagePreview(null);
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
            
            const formData = new FormData();
            formData.append('content', replyContent);
            if (replyingTo && !replyingTo.isMainPost) {
                formData.append('parentReplyId', replyingTo._id);
            }
            if (replyImage) {
                formData.append('image', replyImage);
            }
            
            const response = await axios.post(
                `${API_URL}/api/forums/${id}/reply`,
                formData,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );

            if (response.data.success) {
                toast.success('Reply posted successfully!');
                setReplyContent('');
                setReplyImage(null);
                setImagePreview(null);
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
        const now = new Date();
        const then = new Date(date);
        const seconds = Math.floor((now - then) / 1000);
        
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        
        return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

    // Toggle expanded state for a reply
    const toggleReplyExpansion = (replyId) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(replyId)) {
                newSet.delete(replyId);
            } else {
                newSet.add(replyId);
            }
            return newSet;
        });
    };

    // Render Reply Form Component
    const renderReplyForm = (targetReply = null) => {
        // Only show if replying to this specific reply or to main post (when targetReply is null)
        const isReplyingToThis = targetReply 
            ? replyingTo?._id === targetReply._id 
            : replyingTo === null || replyingTo?.isMainPost;
        
        if (!isReplyingToThis) return null;

        return (
            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-800/50">
                <form onSubmit={handleReplySubmit}>
                    {/* Replying To Indicator */}
                    {replyingTo && !replyingTo.isMainPost && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 truncate">
                                        Replying to @{replyingTo.user.name}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setReplyingTo(null); removeImage(); }}
                                    className="flex-shrink-0 p-0.5 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="mt-1.5 text-xs text-gray-700 dark:text-gray-300 line-clamp-2 pl-5">
                                {replyingTo.content}
                            </p>
                        </div>
                    )}
                    
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={3}
                        placeholder="Write your reply..."
                        className="w-full px-3 py-2 bg-white dark:bg-dark-900 border border-gray-300 dark:border-dark-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        required
                        maxLength={2000}
                        autoFocus
                    />

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-dark-700 mt-2">
                            <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="w-full max-h-64 object-contain bg-gray-100 dark:bg-dark-800"
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {replyContent.length}/2000
                            </p>
                            {/* Image Upload Button */}
                            <label className="cursor-pointer p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => { setReplyingTo(null); removeImage(); }}
                                className="px-3 py-1.5 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !replyContent.trim()}
                                className="px-4 py-1.5 bg-primary-500 text-white rounded-full text-sm font-semibold hover:bg-primary-600 active:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Posting...' : 'Reply'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    };

    // Render a single reply (with collapsible nested replies)
    const renderReply = (reply, index, depth = 0) => {
        const isExpanded = expandedReplies.has(reply._id);
        const hasChildren = reply.children && reply.children.length > 0;
        
        return (
            <div
                key={reply._id}
                className="border-b border-gray-200 dark:border-dark-800 last:border-b-0"
            >
                <div className={`px-4 py-3 transition-colors ${hasChildren ? 'hover:bg-gray-50 dark:hover:bg-dark-800/50' : 'hover:bg-gray-50 dark:hover:bg-dark-800/50'}`}>
                    {/* Twitter-style Reply Layout */}
                    <div className="flex gap-2 sm:gap-3">
                        {/* Avatar */}
                        <Link
                            to={user?._id === reply.user._id ? '/profile' : `/user/${reply.user._id}`}
                            className="flex-shrink-0 hover:opacity-80 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {reply.user.profileImage ? (
                                <img
                                    src={reply.user.profileImage}
                                    alt={reply.user.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {reply.user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Link>

                        {/* Content - Clickable when has children */}
                        <div className="flex-1 min-w-0">
                            <div
                                onClick={() => hasChildren && toggleReplyExpansion(reply._id)}
                                className={hasChildren ? 'cursor-pointer' : ''}
                            >
                                {/* Author Info & Time */}
                                <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                                    <Link
                                        to={user?._id === reply.user._id ? '/profile' : `/user/${reply.user._id}`}
                                        className="font-bold text-sm text-gray-900 dark:text-white hover:underline truncate"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {reply.user.name}
                                    </Link>
                                    {reply.user.role === 'teacher' && (
                                        <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">·</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                                        {formatTime(reply.createdAt)}
                                    </span>
                                </div>

                                {/* Replying To */}
                                {reply.parentReplyData && (
                                    <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                                        Replying to <span className="text-primary-500">@{reply.parentReplyData.user.name}</span>
                                    </div>
                                )}

                                {/* Content */}
                                <p className="text-sm text-gray-900 dark:text-white mb-2 whitespace-pre-wrap leading-relaxed break-words">
                                    {reply.content}
                                </p>

                                {/* Reply Image */}
                                {reply.image && (
                                    <div className="mb-2 rounded-xl overflow-hidden border border-gray-200 dark:border-dark-700">
                                        <img 
                                            src={reply.image} 
                                            alt="Reply" 
                                            className="w-full max-h-80 object-cover"
                                        />
                                    </div>
                                )}

                                {/* Nested Replies Indicator */}
                                {hasChildren && (
                                    <div className="mb-2 flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium">
                                        <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        <span>
                                            {isExpanded ? 'Hide' : 'Show'} {reply.children.length} {reply.children.length === 1 ? 'reply' : 'replies'}
                                        </span>
                                    </div>
                                )}

                                {/* Best Answer Badge */}
                                {reply.isBestAnswer && (
                                    <div className="mb-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Best Answer
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Actions - Twitter Style */}
                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReplyLike(reply._id);
                                    }}
                                    disabled={!token}
                                    className="flex items-center gap-1 hover:text-red-600 transition-colors group"
                                >
                                    <svg className={`w-4 h-4 ${reply.likes.includes(user?._id) ? 'fill-red-600 text-red-600' : ''}`} fill={reply.likes.includes(user?._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span className="text-xs font-medium">{reply.likes.length}</span>
                                </button>

                                {token && !forum.isClosed && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setReplyingTo(reply);
                                        }}
                                        className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                        <span className="text-xs">Reply</span>
                                    </button>
                                )}

                                {isAuthor && !reply.isBestAnswer && !forum.isSolved && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkBestAnswer(reply._id);
                                        }}
                                        className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    >
                                        Mark as best
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reply Form for this specific reply */}
                {token && !forum.isClosed && renderReplyForm(reply)}

                {/* Render nested replies (collapsible) */}
                {hasChildren && isExpanded && (
                    <div className="ml-6 sm:ml-12 border-l-2 border-gray-200 dark:border-dark-700">
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
            <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (!forum) return null;

    const isAuthor = user?._id === forum.author._id;
    const userLiked = forum.likes.includes(user?._id);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
            <div className="max-w-2xl mx-auto bg-white dark:bg-dark-900 min-h-screen border-x border-gray-200 dark:border-dark-800">
                {/* Twitter-style Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-800">
                    <div className="px-4 py-3 flex items-center gap-4">
                        <button
                            onClick={() => navigate('/forums')}
                            className="hover:bg-gray-100 dark:hover:bg-dark-800 p-2 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Post</h1>
                    </div>
                </div>

                {/* Main Post - Twitter Style */}
                <div className="border-b border-gray-200 dark:border-dark-800">
                    <div className="px-4 py-3">
                        {/* Author Info */}
                        <div className="flex items-start gap-3 mb-3">
                            <Link
                                to={user?._id === forum.author._id ? '/profile' : `/user/${forum.author._id}`}
                                className="hover:opacity-80 transition-opacity flex-shrink-0"
                            >
                                {forum.author.profileImage ? (
                                    <img
                                        src={forum.author.profileImage}
                                        alt={forum.author.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                                        {forum.author.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Link>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <Link
                                        to={user?._id === forum.author._id ? '/profile' : `/user/${forum.author._id}`}
                                        className="font-bold text-sm text-gray-900 dark:text-white hover:underline truncate"
                                    >
                                        {forum.author.name}
                                    </Link>
                                    {forum.author.role === 'teacher' && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                            </svg>
                                            <span className="hidden sm:inline">Teacher</span>
                                        </span>
                                    )}
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">·</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                                        {formatTime(forum.createdAt)}
                                    </span>
                                </div>
                                
                                {/* Status Badges */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {forum.isPinned && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                                            📌 <span className="hidden sm:inline">Pinned</span>
                                        </span>
                                    )}
                                    {forum.isSolved && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                                            ✓ <span className="hidden sm:inline">Solved</span>
                                        </span>
                                    )}
                                    {forum.isClosed && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                                            🔒 <span className="hidden sm:inline">Closed</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <p className="text-sm sm:text-base text-gray-900 dark:text-white mb-3 whitespace-pre-wrap leading-relaxed break-words">
                            {forum.content}
                        </p>

                        {/* Forum Image */}
                        {forum.image && (
                            <div className="mb-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-700">
                                <img 
                                    src={forum.image} 
                                    alt="Forum post" 
                                    className="w-full max-h-96 object-cover"
                                />
                            </div>
                        )}

                        {/* Tags */}
                        {forum.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {forum.tags.slice(0, 5).map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm pt-2 border-t border-gray-200 dark:border-dark-700">
                            <button
                                onClick={handleLike}
                                disabled={!token}
                                className="flex items-center gap-1 hover:text-red-600 transition-colors"
                            >
                                <svg className={`w-4 h-4 ${userLiked ? 'fill-red-600 text-red-600' : ''}`} fill={userLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span className="text-xs font-medium">{forum.likes.length}</span>
                            </button>

                            {token && !forum.isClosed && (
                                <button
                                    onClick={() => setReplyingTo({ isMainPost: true })}
                                    className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="text-xs font-medium">{forum.replies.length}</span>
                                </button>
                            )}
                            {(!token || forum.isClosed) && (
                                <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="text-xs font-medium">{forum.replies.length}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="text-xs font-medium">{forum.views}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Replies Section */}
                <div>
                    {/* Status Messages or Reply Form for Main Post */}
                    {!forum.isClosed ? (
                        token ? (
                            renderReplyForm()
                        ) : (
                            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Please login to reply
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700 text-center">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                                This discussion is closed
                            </p>
                        </div>
                    )}

                    {/* Replies List */}
                    <div>
                        {forum.replies.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full mb-3">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No replies yet</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Be the first to share your thoughts!</p>
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
    );
};

export default ForumThread;
