import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import "../../css/AuthStyles.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const response = await authAPI.login(email, password);
      
      if (response && response.access_token) {
        localStorage.setItem("token", response.access_token);
        
        // Fetch user data to get the role or use response.user directly
        const user = response.user || await authAPI.getCurrentUser();
        localStorage.setItem("user", JSON.stringify(user));

        // Route based on role
        if (user.role === 'admin') navigate("/admin");
        else if (user.role === 'manager') navigate("/manager/dashboard");
        else if (user.role === 'driver') navigate("/driver");
        else navigate("/user/dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Navigation to go back home */}
      <Link to="/" className="nav-home-btn" style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 100 }}>
        <i className="fas fa-arrow-left"></i> Back to Home
      </Link>

      {/* Left Side: Visual/Graphic */}
      <div className="auth-visual">
        <div className="floating-element" style={{top: '20%', left: '15%'}}>
          <i className="fas fa-route" style={{color: '#3b82f6', fontSize: '32px'}}></i>
        </div>
        <div className="floating-element" style={{top: '60%', right: '15%', animationDelay: '2s'}}>
          <i className="fas fa-leaf" style={{color: '#10b981', fontSize: '32px'}}></i>
        </div>
        <div className="auth-visual-content">
          <h1>AI Waste Optimizer</h1>
          <p>Sign in to access your intelligent waste management dashboard and real-time fleet analytics.</p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="auth-form-wrapper">
        <div className="auth-form-container">
          <Link to="/" className="auth-logo" style={{textDecoration: 'none'}}>
            <i className="fas fa-leaf"></i>
            <span>EcoSync AI</span>
          </Link>
          
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Enter your credentials to continue</p>
          
          {error && <div className="auth-error"><i className="fas fa-exclamation-circle" style={{marginRight: '8px'}}></i>{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="auth-input-group">
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <i className="fas fa-envelope auth-input-icon"></i>
            </div>
            
            <div className="auth-input-group">
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <i className="fas fa-lock auth-input-icon"></i>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '13px', color: 'var(--auth-text-muted)'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                <input type="checkbox" style={{accentColor: 'var(--auth-primary)'}} /> Remember me
              </label>
              <a href="#" style={{color: 'var(--auth-primary)', textDecoration: 'none'}}>Forgot Password?</a>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : "Sign In"}
            </button>
          </form>

          <div className="auth-links">
            Don't have an account? <Link to="/register">Create one now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
