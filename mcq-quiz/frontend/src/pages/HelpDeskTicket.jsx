import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Loading from '../components/Loading.jsx';
import { formatDate } from '../utils/helpers';

const HelpDeskTicket = () => {
  const { id } = useParams();
  const { user, api } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicket();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchTicket, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/helpdesk/${id}`);
      setTicket(res.data.ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      alert('Ticket not found');
      navigate('/helpdesk');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      const res = await api.post(`/helpdesk/${id}/message`, { content: message });
      if (res.data.success) {
        setMessage('');
        fetchTicket();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/helpdesk/${id}/status`, { status: newStatus });
      fetchTicket();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssignToMe = async () => {
    try {
      await api.patch(`/helpdesk/${id}/assign`, { assignedTo: user.id });
      fetchTicket();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign ticket');
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/helpdesk/${id}/rating`, { rating, feedback });
      setShowRatingModal(false);
      fetchTicket();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit rating');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'open': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'waiting-for-user': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'resolved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return <span className={`px-3 py-1 text-sm rounded-full ${colors[status]}`}>
      {status.replace('-', ' ').toUpperCase()}
    </span>;
  };

  if (loading) return <Loading />;
  if (!ticket) return null;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/helpdesk')}
            className={`mb-4 px-4 py-2 rounded-lg ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
            } shadow`}
          >
            ← Back to Tickets
          </button>
          
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-3">{ticket.subject}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  {getStatusBadge(ticket.status)}
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {ticket.category}
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Created {formatDate(ticket.createdAt)}
                  </span>
                </div>
              </div>
              {user?.role === 'teacher' && (
                <div className="flex gap-2">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`px-4 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="waiting-for-user">Waiting for User</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  {!ticket.assignedTo && (
                    <button
                      onClick={handleAssignToMe}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Assign to Me
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {ticket.assignedTo && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Assigned to: <span className="font-medium">{ticket.assignedTo.name}</span>
                </p>
              </div>
            )}
            
            {ticket.rating && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Rating: <span className="text-yellow-500 font-medium">{'⭐'.repeat(ticket.rating)}</span>
                </p>
                {ticket.feedback && (
                  <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Feedback: {ticket.feedback}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Thread */}
        <div className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow mb-6`}>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <div className="space-y-4">
              {ticket.messages.map((msg, index) => {
                const isMyMessage = msg.sender._id === user?.id;
                return (
                  <div
                    key={index}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      <img
                        src={msg.sender.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.name)}`}
                        alt={msg.sender.name}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {msg.sender.name}
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatDate(msg.createdAt)}
                          </span>
                          {msg.sender.role === 'teacher' && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full">
                              Support
                            </span>
                          )}
                        </div>
                        <div
                          className={`px-4 py-3 rounded-lg ${
                            isMyMessage
                              ? 'bg-blue-600 text-white'
                              : darkMode
                              ? 'bg-gray-700 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Message Input */}
        {ticket.status !== 'closed' && (
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <form onSubmit={handleSendMessage}>
              <div className="flex gap-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed self-end"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rating Button (for resolved/closed tickets not yet rated) */}
        {user?.role === 'student' && 
         ['resolved', 'closed'].includes(ticket.status) && 
         !ticket.rating && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Rate Your Experience
            </button>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`max-w-md w-full rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-2xl font-bold mb-6">Rate Your Support Experience</h2>
              <form onSubmit={handleSubmitRating}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Rating *</label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-4xl transition-all ${
                          star <= rating ? 'text-yellow-500' : 'text-gray-400'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Feedback (Optional)</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Tell us about your experience..."
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={rating === 0}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Rating
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className={`px-6 py-3 rounded-lg border ${
                      darkMode 
                        ? 'border-gray-600 hover:bg-gray-700' 
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
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

export default HelpDeskTicket;
