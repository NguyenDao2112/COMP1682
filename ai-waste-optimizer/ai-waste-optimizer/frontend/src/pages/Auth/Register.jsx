import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import "../../css/AuthStyles.css";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    
    try {
      const result = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "driver"
      });

      if (result) {
        navigate("/login", { state: { message: "Registration successful. Please login." } });
      }
    } catch (err) {
      setError(err.message || "Failed to register");
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
        <div className="floating-element" style={{top: '30%', right: '10%'}}>
          <i className="fas fa-truck" style={{color: '#f59e0b', fontSize: '32px'}}></i>
        </div>
        <div className="floating-element" style={{top: '70%', left: '20%', animationDelay: '1s'}}>
          <i className="fas fa-chart-line" style={{color: '#8b5cf6', fontSize: '32px'}}></i>
        </div>
        <div className="auth-visual-content">
          <h1>Join EcoSync AI</h1>
          <p>Become part of the most advanced fleet and waste management ecosystem.</p>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="auth-form-wrapper">
        <div className="auth-form-container">
          <Link to="/" className="auth-logo" style={{textDecoration: 'none'}}>
            <i className="fas fa-leaf"></i>
            <span>EcoSync AI</span>
          </Link>
          
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Fill in your details to get started</p>
          
          {error && <div className="auth-error"><i className="fas fa-exclamation-circle" style={{marginRight: '8px'}}></i>{error}</div>}
          
          <form onSubmit={handleRegister}>
            <div className="auth-input-group">
              <input 
                type="text" 
                name="name"
                placeholder="Full Name" 
                value={formData.name}
                onChange={handleChange}
                required
              />
              <i className="fas fa-user auth-input-icon"></i>
            </div>

            <div className="auth-input-group">
              <input 
                type="email" 
                name="email"
                placeholder="Email Address" 
                value={formData.email}
                onChange={handleChange}
                required
              />
              <i className="fas fa-envelope auth-input-icon"></i>
            </div>
            
            <div className="auth-input-group">
              <input 
                type="password" 
                name="password"
                placeholder="Password" 
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
              <i className="fas fa-lock auth-input-icon"></i>
            </div>

            <div className="auth-input-group">
              <input 
                type="password" 
                name="confirmPassword"
                placeholder="Confirm Password" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <i className="fas fa-check-circle auth-input-icon"></i>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : "Create Account"}
            </button>
          </form>

          <div className="auth-links">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
