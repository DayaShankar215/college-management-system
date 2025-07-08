import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiLogOut,
  FiUser,
  FiBook,
  FiCalendar,
  FiAward,
  FiBarChart2,
  FiBell,
  FiUsers
} from 'react-icons/fi';
import axios from 'axios';
import './Dashboard.css';

function TeacherDashboard() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    navigate('/login');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const teacherId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        
        if (!teacherId || !token || role !== 'teacher') {
          navigate('/login');
          return;
        }
        
        const res = await axios.get(
          `http://localhost:5000/api/teacher/${teacherId}/teacher-dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        setTeacherData(res.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please try again.');
        
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const calculateTotalStudents = () => {
    if (!teacherData?.courses?.length) return 0;
    return teacherData.courses.reduce(
      (acc, course) => acc + (course.studentCount || 0),
      0
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!teacherData) {
    return (
      <div className="dashboard-container">
        <p>No data found.</p>
        <button onClick={handleLogout} className="logout-button">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <h1 className="navbar-brand">Teacher Portal</h1>
        </div>
        <div className="navbar-actions">
          <button className="notification-button">
            <FiBell />
            {teacherData.upcomingEvents?.length > 0 && (
              <span className="notification-badge">
                {teacherData.upcomingEvents.length}
              </span>
            )}
          </button>
          <div className="profile-dropdown">
            <button className="profile-button" onClick={toggleDropdown}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  teacherData.name
                )}&background=4f46e5&color=fff`}
                alt="Profile"
                className="profile-icon"
              />
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item">
                  <FiUser className="dropdown-icon" />
                  <span>My Profile</span>
                </button>
                <button className="dropdown-item" onClick={handleLogout}>
                  <FiLogOut className="dropdown-icon" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="welcome-banner">
          <h1>Welcome, {teacherData.name}!</h1>
          <p>{teacherData.department} Department</p>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">
              <FiBook />
            </div>
            <div>
              <h3>{teacherData.courses?.length || 0}</h3>
              <p>Courses Teaching</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div>
              <h3>{calculateTotalStudents()}</h3>
              <p>Total Students</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiCalendar />
            </div>
            <div>
              <h3>{teacherData.upcomingEvents?.length || 0}</h3>
              <p>Upcoming Events</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card courses-card">
            <h2>
              <FiBook /> My Courses
            </h2>
            <div className="courses-list">
              {!teacherData.courses?.length ? (
                <p className="no-courses">No courses assigned.</p>
              ) : (
                teacherData.courses.map((course) => (
                  <div key={course.id} className="course-item">
                    <h3>{course.name} ({course.code})</h3>
                    <div className="course-stats">
                      <span>Students: {course.studentCount || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card schedule-card">
            <h2>
              <FiCalendar /> Upcoming Events
            </h2>
            <div className="events-list">
              {!teacherData.upcomingEvents?.length ? (
                <p className="no-events">No upcoming events.</p>
              ) : (
                teacherData.upcomingEvents.map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-date">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="event-details">
                      <h3>{event.title}</h3>
                      <p>{event.course} ({event.student_count} students)</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card quick-links">
            <h2>
              <FiBarChart2 /> Quick Access
            </h2>
            <div className="links-grid">
              <button className="quick-link">
                <FiBook /> Course Materials
              </button>
              <button className="quick-link">
                <FiAward /> Grade Students
              </button>
              <button className="quick-link">
                <FiCalendar /> Schedule Event
              </button>
              <button className="quick-link">
                <FiUser /> Profile
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherDashboard;