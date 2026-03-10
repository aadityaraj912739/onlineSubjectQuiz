import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Loading from '../components/Loading.jsx';
import { formatDate } from '../utils/helpers';

const HelpDesk = () => {
  const { user, api } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '', priority: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'General Query',
    priority: 'medium',
    initialMessage: ''
  });

  useEffect(() => {
    fetchTickets();
    if (user?.role === 'teacher') {
      fetchStats();
    }
  }, [filter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);
      if (filter.priority) params.append('priority', filter.priority);
      
      const res = await api.get(`/helpdesk?${params.toString()}`);
      setTickets(res.data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/helpdesk/stats');
      setStats(res.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/helpdesk', newTicket);
      if (res.data.success) {
        setShowCreateModal(false);
        setNewTicket({
          subject: '',
          category: 'General Query',
          priority: 'medium',
          initialMessage: ''
        });
        fetchTickets();
        navigate(`/helpdesk/${res.data.ticket._id}`);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create ticket');
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
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[status]}`}>
      {status.replace('-', ' ').toUpperCase()}
    </span>;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'medium': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'urgent': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[priority]}`}>
      {priority.toUpperCase()}
    </span>;
  };

  if (loading) return <Loading />;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Help Desk</h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Get support from our team
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/contact')}
              className={`px-6 py-3 rounded-lg border transition-colors ${
                darkMode 
                  ? 'border-gray-600 hover:bg-gray-700' 
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              Contact Us
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Ticket
            </button>
          </div>
        </div>

        {/* Stats (Teacher only) */}
        {user?.role === 'teacher' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Tickets</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Open</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">{stats.open}</p>
            </div>
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Resolved</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats.resolved}</p>
            </div>
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Rating</p>
              <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.averageRating.toFixed(1)} ⭐</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="waiting-for-user">Waiting for User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">All Categories</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Account">Account</option>
                <option value="Exam Related">Exam Related</option>
                <option value="General Query">General Query</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={filter.priority}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className={`p-12 text-center rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No tickets found. Create your first support ticket!
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => navigate(`/helpdesk/${ticket._id}`)}
                className={`p-6 rounded-lg cursor-pointer transition-all ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-750' 
                    : 'bg-white hover:shadow-lg'
                } shadow`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{ticket.subject}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {ticket.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Created {formatDate(ticket.createdAt)}
                    </p>
                    {(user?.role === 'student' && ticket.unreadByUser) && (
                      <span className="inline-block mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        New Reply
                      </span>
                    )}
                    {(user?.role === 'teacher' && ticket.unreadByAdmin) && (
                      <span className="inline-block mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        Unread
                      </span>
                    )}
                  </div>
                </div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                  {ticket.messages[0]?.content}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={ticket.user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.user.name)}`}
                      alt={ticket.user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {ticket.user.name}
                    </span>
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`max-w-2xl w-full rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-2xl font-bold mb-6">Create New Support Ticket</h2>
              <form onSubmit={handleCreateTicket}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject *</label>
                    <input
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      required
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        value={newTicket.category}
                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="General Query">General Query</option>
                        <option value="Technical Issue">Technical Issue</option>
                        <option value="Account">Account</option>
                        <option value="Exam Related">Exam Related</option>
                        <option value="Feature Request">Feature Request</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Priority</label>
                      <select
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message *</label>
                    <textarea
                      value={newTicket.initialMessage}
                      onChange={(e) => setNewTicket({ ...newTicket, initialMessage: e.target.value })}
                      required
                      rows={6}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Provide detailed information about your request..."
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className={`px-6 py-3 rounded-lg border transition-colors ${
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

export default HelpDesk;
