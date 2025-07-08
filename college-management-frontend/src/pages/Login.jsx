import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom"; 
import "./Login.css";

function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Manual decode error:", error);
    return null;
  }
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("verified") === "true") {
      setMessage("✅ Email verified! You can now log in.");
    }
  }, [location.search]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email: email.trim(),
        password,
      });

      const token = response.data.token;
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("email", response.data.email);
      localStorage.setItem("userId", response.data.id);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("name", response.data.name);

      const decoded = decodeJwt(token);
      if (!decoded) {
        setError("Failed to decode token.");
        return;
      }

      // Redirect based on role
      if (response.data.role === 'teacher') {
        navigate("/teacher-dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      if (err.response) {
        if (err.response.status === 403) {
          setError("Please verify your email before logging in.");
        } else if (err.response.status === 401) {
          setError("Invalid email or password.");
        } else {
          setError("Login failed. Please try again later.");
        }
      } else {
        setError("Network error. Please try again.");
      }
    }
  };
  
  
  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h1 className="login-title">Login</h1>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          required
          autoComplete="email"
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
            autoComplete="current-password"
          />
          <span
            className="password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            {showPassword ? "🙊" : "🙈"}
          </span>
        </div>

        <button type="submit" className="login-button">
          Login
        </button>

        <div style={{ marginTop: "1rem", textAlign: "center", color: "black" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#007bff", textDecoration: "none" }}>
            Register here
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Login;