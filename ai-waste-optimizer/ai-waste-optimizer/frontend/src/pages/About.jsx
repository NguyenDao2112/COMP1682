import React from "react";
import { Link } from "react-router-dom";
import "../css/AuthStyles.css";

function About() {
  return (
    <div className="about-hero">
      
      {/* Navigation to go back home */}
      <Link to="/" className="nav-home-btn">
        <i className="fas fa-arrow-left"></i> Back to Home
      </Link>

      <div className="about-content">
        <h1 className="about-title">Revolutionizing Waste Management with AI</h1>
        <p className="about-subtitle">
          EcoSync AI is a state-of-the-art platform designed to optimize garbage collection routes, reduce carbon footprints, and empower cities with data-driven sustainability.
        </p>

        <div className="about-bento-grid">
          
          {/* Feature 1 */}
          <div className="about-card" style={{gridColumn: 'span 4'}}>
            <div className="about-card-icon" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
              <i className="fas fa-route"></i>
            </div>
            <h3>Smart Routing</h3>
            <p>Our algorithms calculate the most efficient collection paths in real-time, adapting to traffic and bin fill levels to save time.</p>
          </div>

          {/* Feature 2 */}
          <div className="about-card" style={{gridColumn: 'span 4'}}>
            <div className="about-card-icon" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>
              <i className="fas fa-leaf"></i>
            </div>
            <h3>Eco-Friendly</h3>
            <p>By minimizing driving distances, we significantly reduce fuel consumption and greenhouse gas emissions, creating greener cities.</p>
          </div>

          {/* Feature 3 */}
          <div className="about-card" style={{gridColumn: 'span 4'}}>
            <div className="about-card-icon" style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}>
              <i className="fas fa-chart-pie"></i>
            </div>
            <h3>Real-Time Analytics</h3>
            <p>Managers get a bird's-eye view of fleet operations with predictive analytics, pinpointing inefficiencies before they happen.</p>
          </div>

          {/* Large Impact Stat */}
          <div className="about-card" style={{gridColumn: 'span 12', display: 'flex', alignItems: 'center', gap: '32px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))'}}>
            <div style={{flex: 1}}>
              <h3 style={{fontSize: '28px', color: '#10b981', marginBottom: '8px'}}>Up to 30% Fuel Savings</h3>
              <p style={{fontSize: '18px'}}>Our pilot programs have demonstrated massive reductions in operational costs and environmental impact across major municipal zones.</p>
            </div>
            <div style={{fontSize: '64px', color: 'rgba(255,255,255,0.1)', fontWeight: '900'}}>
              <i className="fas fa-gas-pump"></i>
            </div>
          </div>

        </div>

        <Link to="/register" className="about-btn">
          Join the Platform <i className="fas fa-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
}

export default About;
