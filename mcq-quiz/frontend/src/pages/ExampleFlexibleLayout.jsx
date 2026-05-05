import React, { useEffect, useState } from 'react';
import { FlexiblePageLayout, SplitPanelLayout } from '../components/PageLayoutWrapper';

/**
 * Example: Teacher Dashboard using FlexiblePageLayout
 * All business logic should be in backend controllers
 * Layout is defined in layoutConfig.js
 */
function TeacherDashboardExample() {
  const [stats, setStats] = useState({
    totalExams: 0,
    activeStudents: 0,
    totalResponses: 0,
    avgScore: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch data from backend controller (not local logic)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Call your backend API
        // const response = await axios.get('/api/dashboard/teacher/stats');
        // setStats(response.data.stats);
        
        // Simulate API call
        setTimeout(() => {
          setStats({
            totalExams: 12,
            activeStudents: 450,
            totalResponses: 5400,
            avgScore: 76.5
          });
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Right panel content - Statistics
  const statsPanel = (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Total Exams</h4>
        <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: '#007acc' }}>
          {stats.totalExams}
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Active Students</h4>
        <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>
          {stats.activeStudents}
        </p>
      </div>

      <div>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Average Score</h4>
        <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b' }}>
          {stats.avgScore.toFixed(1)}%
        </p>
      </div>
    </div>
  );

  // Main dashboard content
  const dashboardContent = (
    <div style={{ padding: '2rem' }}>
      <h1>Teacher Dashboard</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            <Card title="Create Exam" icon="✏️">
              <p>Create a new exam for your students</p>
              <a href="/create-exam" style={{ color: '#007acc' }}>Create Now →</a>
            </Card>

            <Card title="View Results" icon="📊">
              <p>Analyze exam results and student performance</p>
              <a href="/exam-results" style={{ color: '#007acc' }}>View Results →</a>
            </Card>

            <Card title="Manage Exams" icon="📝">
              <p>Edit, duplicate, or delete your exams</p>
              <a href="/teacher-exams" style={{ color: '#007acc' }}>Manage →</a>
            </Card>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Quick Stats</h3>
            <p>Total Responses: <strong>{stats.totalResponses}</strong></p>
            <p>This month's exams: <strong>3</strong></p>
            <p>Pending reviews: <strong>12</strong></p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <FlexiblePageLayout
      pageId="teacher-dashboard"
      pageTitle="Teacher Dashboard"
      secondaryContent={statsPanel}
      config={{
        showSecondaryPanel: true,
        showBottomPanel: false
      }}
    >
      {dashboardContent}
    </FlexiblePageLayout>
  );
}

/**
 * Example: Student Dashboard using SplitPanelLayout
 */
function StudentDashboardExample() {
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch from backend controller
      setTimeout(() => {
        setUpcomingExams([
          { id: 1, name: 'Mathematics Mid-Term', date: '2026-05-15' },
          { id: 2, name: 'Science Quiz', date: '2026-05-20' }
        ]);
        setRecentResults([
          { id: 1, name: 'English Test', score: 92, total: 100 },
          { id: 2, name: 'History Quiz', score: 85, total: 100 }
        ]);
      }, 300);
    };

    fetchData();
  }, []);

  const rightContent = (
    <div style={{ padding: '1rem' }}>
      <h4>Recent Results</h4>
      {recentResults.map(result => (
        <div key={result.id} style={{
          padding: '0.75rem',
          marginBottom: '0.5rem',
          background: '#f0f0f0',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>{result.name}</p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Score: <strong>{result.score}/{result.total}</strong>
          </p>
        </div>
      ))}
    </div>
  );

  const mainContent = (
    <div style={{ padding: '2rem' }}>
      <h1>Your Dashboard</h1>
      
      <h3 style={{ marginTop: '2rem' }}>Upcoming Exams</h3>
      <div>
        {upcomingExams.length > 0 ? (
          upcomingExams.map(exam => (
            <div key={exam.id} style={{
              padding: '1rem',
              marginBottom: '1rem',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>{exam.name}</h4>
              <p style={{ margin: 0, color: '#666' }}>📅 {exam.date}</p>
              <button style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Take Exam
              </button>
            </div>
          ))
        ) : (
          <p>No upcoming exams</p>
        )}
      </div>
    </div>
  );

  return (
    <SplitPanelLayout
      title="Student Dashboard"
      mainContent={mainContent}
      rightTitle="Recent Results"
      rightContent={rightContent}
    />
  );
}

/**
 * Example: Create Exam Page using split layout
 * Shows editor with properties panel
 */
function CreateExamExample() {
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    totalQuestions: 0,
    duration: 60,
    totalMarks: 100
  });

  const handleChange = (field, value) => {
    setExamData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const propertiesPanel = (
    <div style={{ padding: '1rem' }}>
      <h4>Exam Properties</h4>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
          Total Questions
        </label>
        <input
          type="number"
          value={examData.totalQuestions}
          onChange={(e) => handleChange('totalQuestions', e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
          Duration (minutes)
        </label>
        <input
          type="number"
          value={examData.duration}
          onChange={(e) => handleChange('duration', e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
          Total Marks
        </label>
        <input
          type="number"
          value={examData.totalMarks}
          onChange={(e) => handleChange('totalMarks', e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
    </div>
  );

  const editorContent = (
    <div style={{ padding: '2rem' }}>
      <h1>Create New Exam</h1>

      <div style={{ marginTop: '2rem', maxWidth: '600px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Exam Title
          </label>
          <input
            type="text"
            value={examData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter exam title"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            value={examData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Enter exam description"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem',
              minHeight: '150px'
            }}
          />
        </div>

        <button style={{
          padding: '0.75rem 2rem',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold'
        }}>
          Continue to Questions
        </button>
      </div>
    </div>
  );

  return (
    <SplitPanelLayout
      title="Create Exam"
      mainContent={editorContent}
      rightTitle="Exam Properties"
      rightContent={propertiesPanel}
      showBottomPanel={false}
    />
  );
}

/**
 * Reusable Card Component
 */
function Card({ title, icon, children }) {
  return (
    <div style={{
      padding: '1.5rem',
      background: '#f9f9f9',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      <h3 style={{ margin: '0 0 0.5rem 0' }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

export {
  TeacherDashboardExample,
  StudentDashboardExample,
  CreateExamExample
};
