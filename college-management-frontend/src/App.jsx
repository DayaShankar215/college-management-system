import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/StudetDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";

function RequireAuth({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth allowedRoles={['student']}>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher-dashboard"
            element={
              <RequireAuth allowedRoles={['teacher']}>
                <TeacherDashboard />
              </RequireAuth>
            }
          />
          
          {/* Default route redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;