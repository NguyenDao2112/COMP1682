import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import "../css/Footer.css";

function Footer() {
  const { darkMode } = useTheme();

  return (
    <footer className={`site-footer ${darkMode ? "dark" : "light"}`}>
      <div className="sf-container">
        <div className="sf-grid">
          <div className="sf-brand">
            <div className="sf-logo"><i className="fas fa-leaf"></i> AI Waste Optimizer</div>
            <p>Smart City Waste Management Platform. Optimizing collection, reducing emissions, building sustainable communities.</p>
          </div>
          <div className="sf-col">
            <h4>Platform</h4>
            <Link to="/about">About</Link>
            <Link to="/register">Get Started</Link>
            <Link to="/user/feedback">Feedback</Link>
          </div>
          <div className="sf-col">
            <h4>Access</h4>
            <Link to="/user/dashboard">Citizen Portal</Link>
            <Link to="/admin/dashboard">Admin Dashboard</Link>
            <Link to="/driver/dashboard">Driver Portal</Link>
          </div>
          <div className="sf-col">
            <h4>Connect</h4>
            <div className="sf-socials">
              <a href="https://facebook.com" target="_blank" rel="noreferrer"><i className="fab fa-facebook-f"></i></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer"><i className="fab fa-twitter"></i></a>
              <a href="https://github.com" target="_blank" rel="noreferrer"><i className="fab fa-github"></i></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer"><i className="fab fa-linkedin-in"></i></a>
            </div>
            <p className="sf-address"><i className="fas fa-map-marker-alt"></i> Da Nang, Vietnam</p>
          </div>
        </div>
        <div className="sf-bottom">
          <p>2026 AI Waste Optimizer - Smart City Waste Management. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
