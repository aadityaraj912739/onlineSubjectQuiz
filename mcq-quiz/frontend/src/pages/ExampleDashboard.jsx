import React, { useEffect, useState } from 'react';
import PageLayoutWrapper from '../components/PageLayoutWrapper';
import { useLayout } from '../context/LayoutContext';
import { useUserType } from '../context/UserTypeContext';
import { useAuth } from '../context/AuthContext';

/**
 * Example Dashboard Page
 * Demonstrates how to use the new VSCode-like layout system
 * 
 * Features shown:
 * - Dynamic menu based on user role
 * - Secondary panel with properties
 * - Bottom panel with console/logs
 * - Tab management
 * - Layout context usage
 */
function ExampleDashboard() {
  const { user } = useAuth();
  const { getMenuItems } = useUserType();
  const { toggleSidebar, sidebarCollapsed, addTab } = useLayout();
  
  const [stats, setStats] = useState({
    totalExams: 0,
    activeUsers: 0,
    averageScore: 0
  });

  // Simulate loading dashboard data
  useEffect(() => {
    const loadData = async () => {
      // Add a tab for this page
      addTab({
        id: 'dashboard-tab',
        label: 'Dashboard',
        icon: '📊',
        path: window.location.pathname
      });

      // Simulate API call
      setTimeout(() => {
        setStats({
          totalExams: user?.role === 'teacher' ? 12 : 8,
          activeUsers: user?.role === 'teacher' ? 450 : 1,
          averageScore: user?.role === 'teacher' ? 0 : 78.5
        });
      }, 500);
    };

    loadData();
  }, [user, addTab]);

  // Secondary panel content - Shows statistics
  const statsPanel = (
    <div className="stats-panel">
      <div className="stat-item">
        <span className="stat-label">Total {user?.role === 'teacher' ? 'Exams' : 'Attempts'}</span>
        <span className="stat-value">{stats.totalExams}</span>
      </div>
      
      {user?.role === 'teacher' && (
        <div className="stat-item">
          <span className="stat-label">Active Students</span>
          <span className="stat-value">{stats.activeUsers}</span>
        </div>
      )}
      
      {user?.role === 'student' && (
        <div className="stat-item">
          <span className="stat-label">Average Score</span>
          <span className="stat-value">{stats.averageScore}%</span>
        </div>
      )}

      <button 
        className="btn-secondary mt-4 w-full"
        onClick={toggleSidebar}
      >
        {sidebarCollapsed ? '📂 Show Menu' : '📂 Hide Menu'}
      </button>
    </div>
  );

  // Bottom panel content - Shows activity log
  const activityLog = (
    <div className="activity-log">
      <div className="log-entry">
        <span className="log-time">10:32 AM</span>
        <span className="log-msg">Page loaded successfully</span>
      </div>
      <div className="log-entry">
        <span className="log-time">10:32 AM</span>
        <span className="log-msg">User data fetched</span>
      </div>
      <div className="log-entry info">
        <span className="log-time">10:32 AM</span>
        <span className="log-msg">✓ Layout initialized</span>
      </div>
    </div>
  );

  // Main dashboard content
  const dashboardContent = (
    <div className="dashboard-container">
      <h1 className="dashboard-title">
        Welcome, {user?.name}! 👋
      </h1>
      
      <p className="dashboard-subtitle">
        You're logged in as: <strong>{user?.role?.toUpperCase()}</strong>
      </p>

      <div className="dashboard-grid">
        {/* Quick Stats Cards */}
        <div className="card">
          <div className="card-header">
            <h3>📊 Statistics</h3>
          </div>
          <div className="card-body">
            <p>Total {user?.role === 'teacher' ? 'Exams Created' : 'Exams Taken'}: <strong>{stats.totalExams}</strong></p>
            {user?.role === 'student' && <p>Average Score: <strong>{stats.averageScore}%</strong></p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          <div className="card-body">
            {user?.role === 'teacher' && (
              <>
                <a href="/create-exam" className="action-link">📝 Create New Exam</a>
                <a href="/teacher-exams" className="action-link">📋 View My Exams</a>
                <a href="/exam-results" className="action-link">📈 View Results</a>
              </>
            )}
            {user?.role === 'student' && (
              <>
                <a href="/exams" className="action-link">📋 Available Exams</a>
                <a href="/exam-results" className="action-link">🎯 My Results</a>
                <a href="/study-materials" className="action-link">📚 Study Materials</a>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card full-width">
          <div className="card-header">
            <h3>📅 Recent Activity</h3>
          </div>
          <div className="card-body">
            <div className="activity-list">
              <div className="activity-item">
                {user?.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'} Dashboard loaded successfully
              </div>
              <div className="activity-item">
                📌 You have 5 unread notifications
              </div>
              <div className="activity-item">
                ✓ All systems operational
              </div>
            </div>
          </div>
        </div>

        {/* Features Information */}
        <div className="card full-width">
          <div className="card-header">
            <h3>✨ Layout Features</h3>
          </div>
          <div className="card-body">
            <ul className="features-list">
              <li>✅ Collapsible sidebar - Click the toggle button or use the menu</li>
              <li>✅ Tab management - Tabs appear at the top for open pages</li>
              <li>✅ Secondary panel - See statistics on the right side</li>
              <li>✅ Bottom console - Activity logs and debugging information</li>
              <li>✅ Resizable panels - Drag the borders to resize panels</li>
              <li>✅ Persistent state - Your layout preferences are saved</li>
              <li>✅ Dynamic menu - Menu items change based on your role</li>
              <li>✅ Dark mode support - Toggle in theme settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayoutWrapper
      pageTitle="Dashboard"
      showSecondaryPanel={true}
      secondaryPanelTitle="Quick Stats"
      secondaryPanelContent={statsPanel}
      showBottomPanel={true}
      bottomPanelTitle="Activity Log"
      bottomPanelContent={activityLog}
    >
      {dashboardContent}
    </PageLayoutWrapper>
  );
}

export default ExampleDashboard;

// CSS for this component (add to your stylesheet or create ExampleDashboard.css)
const styles = `
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1e1e1e;
}

.dark-mode .dashboard-title {
  color: #ffffff;
}

.dashboard-subtitle {
  font-size: 1rem;
  color: #666;
  margin-bottom: 2rem;
}

.dark-mode .dashboard-subtitle {
  color: #aaa;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.card {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.dark-mode .card {
  background: #2d2d2d;
  border-color: #3e3e42;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.dark-mode .card-header {
  background: #3e3e42;
  border-bottom-color: #4e4e52;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.card-body {
  padding: 1.5rem;
}

.card-body p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.action-link {
  display: block;
  padding: 0.75rem 0;
  color: #007acc;
  text-decoration: none;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.dark-mode .action-link {
  border-bottom-color: #3e3e42;
}

.action-link:hover {
  color: #005a9e;
  padding-left: 0.25rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  padding: 0.75rem;
  background: #fff;
  border-left: 3px solid #007acc;
  border-radius: 0 4px 4px 0;
  font-size: 0.9rem;
}

.dark-mode .activity-item {
  background: #1e1e1e;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-list li {
  padding: 0.5rem 0;
  font-size: 0.95rem;
  border-bottom: 1px solid #f0f0f0;
}

.dark-mode .features-list li {
  border-bottom-color: #3e3e42;
}

.stats-panel .stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #007acc;
}

.activity-log {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  max-height: 100px;
  overflow-y: auto;
}

.log-entry {
  padding: 0.25rem 0;
  color: #aaa;
}

.log-time {
  color: #666;
  margin-right: 0.5rem;
}

.log-msg {
  color: #d4d4d4;
}

.log-entry.info {
  color: #4ec9b0;
}

.mt-4 {
  margin-top: 1rem;
}

.w-full {
  width: 100%;
}

.btn-secondary {
  padding: 0.75rem 1rem;
  background: #e0e0e0;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.dark-mode .btn-secondary {
  background: #3e3e42;
  border-color: #4e4e52;
  color: #cccccc;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.dark-mode .btn-secondary:hover {
  background: #4e4e52;
}
`;
