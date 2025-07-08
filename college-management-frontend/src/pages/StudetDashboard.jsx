import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiLogOut,
  FiUser,
  FiBook,
  FiCalendar,
  FiAward,
  FiClock,
  FiBarChart2,
  FiBell
} from 'react-icons/fi';
import axios from 'axios';
import './Dashboard.css';

function StudentDashboard() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [studentData, setStudentData] = useState(null);
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
        const studentId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        
        if (!studentId || !token || role !== 'student') {
          navigate('/login');
          return;
        }
        
        const res = await axios.get(
          `http://localhost:5000/api/student/${studentId}/student-dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        setStudentData(res.data);
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

  const calculateGPA = () => {
    if (!studentData?.courses?.length) return 0.0;

    const gpaMap = {
      A: 4.0,
      "A-": 3.7,
      "B+": 3.3,
      B: 3.0,
      "B-": 2.7,
      "C+": 2.3,
      C: 2.0,
      D: 1.0,
      F: 0.0,
    };

    const total = studentData.courses.reduce((acc, course) => {
      return acc + (gpaMap[course.grade?.trim()] || 0);
    }, 0);

    return (total / studentData.courses.length).toFixed(2);
  };

  const calculateAverageAttendance = () => {
    if (!studentData?.courses?.length) return 0;

    const total = studentData.courses.reduce((acc, course) => {
      const attendance = parseInt(course.attendance) || 0;
      return acc + attendance;
    }, 0);

    return Math.round(total / studentData.courses.length);
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

  if (!studentData) {
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
          <h1 className="navbar-brand">Student Portal</h1>
        </div>
        <div className="navbar-actions">
          <button className="notification-button">
            <FiBell />
            {studentData.upcomingEvents?.length > 0 && (
              <span className="notification-badge">
                {studentData.upcomingEvents.length}
              </span>
            )}
          </button>
          <div className="profile-dropdown">
            <button className="profile-button" onClick={toggleDropdown}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  studentData.name
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
          <h1>Welcome back, {studentData.name}!</h1>
          <p>Here's your academic summary</p>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">
              <FiBook />
            </div>
            <div>
              <h3>{studentData.courses?.length || 0}</h3>
              <p>Active Courses</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiAward />
            </div>
            <div>
              <h3>{calculateGPA()}</h3>
              <p>Estimated GPA</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiClock />
            </div>
            <div>
              <h3>{calculateAverageAttendance()}%</h3>
              <p>Average Attendance</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card courses-card">
            <h2>
              <FiBook /> My Courses
            </h2>
            <div className="courses-list">
              {!studentData.courses?.length ? (
                <p className="no-courses">No courses enrolled.</p>
              ) : (
                studentData.courses.map((course) => (
                  <div key={course.id} className="course-item">
                    <h3>
                      {course.name}
                      {course.code ? ` (${course.code})` : ''}
                    </h3>
                    <div className="course-stats">
                      <span>Attendance: {course.attendance || 'N/A'}</span>
                      <span>Grade: {course.grade || 'N/A'}</span>
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
              {!studentData.upcomingEvents?.length ? (
                <p className="no-events">No upcoming events.</p>
              ) : (
                studentData.upcomingEvents.map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-date">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="event-details">
                      <h3>{event.title}</h3>
                      <p>{event.course}</p>
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
                <FiAward /> Grades
              </button>
              <button className="quick-link">
                <FiCalendar /> Timetable
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

export default StudentDashboard;