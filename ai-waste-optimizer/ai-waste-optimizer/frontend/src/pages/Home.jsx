import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { binsAPI } from "../services/api";
import "../css/HomeStyles.css";

function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [metricsVisible, setMetricsVisible] = useState(false);
  const metricsRef = useRef(null);
  const [animatedMetrics, setAnimatedMetrics] = useState({
    tonsCollected: 0, fuelSaved: 0, efficiency: 0
  });
  const [realMetrics, setRealMetrics] = useState({
    tonsCollected: 338, fuelSaved: 4050, efficiency: 94
  });
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setNavScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch real metrics from backend (if available) to show on Homepage
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const bins = await binsAPI.getAll();
        if (bins && bins.length > 0) {
          // Calculate stats based on current system data
          const totalKg = bins.reduce((sum, bin) => sum + (bin.current_fill_level || 0) * 2, 0);
          setRealMetrics(prev => ({
            ...prev,
            tonsCollected: Math.round(totalKg / 100) // Scaled for demo impact
          }));
        }
      } catch (e) {
        console.error("Failed to load metrics", e);
      }
    };
    fetchMetrics();
  }, []);

  // Animate metrics on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setMetricsVisible(true); },
      { threshold: 0.3 }
    );
    if (metricsRef.current) observer.observe(metricsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!metricsVisible) return;
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      setAnimatedMetrics({
        tonsCollected: Math.round(realMetrics.tonsCollected * eased),
        fuelSaved: Math.round(realMetrics.fuelSaved * eased),
        efficiency: Math.round(realMetrics.efficiency * eased),
      });
      
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [metricsVisible, realMetrics]);

  return (
    <div className="home-wrapper">
      
      {/* Navigation */}
      <nav className={`home-nav ${navScrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="home-logo">
          <i className="fas fa-leaf"></i> EcoSync AI
        </Link>
        <div className="home-nav-links">
          <Link to="/about">About Us</Link>
          <Link to="/login" style={{color: '#fff', fontWeight: '600'}}>Sign In</Link>
          <Link to="/register" className="home-btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">Next-Gen SaaS Platform v2.0</div>
          <h1 className="hero-title">AI-Powered Waste Management</h1>
          <p className="hero-subtitle">
            Optimize collection routes, monitor real-time bin levels, and reduce fuel emissions. Transform your city's waste operations with intelligent algorithms.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn-large primary">Start Optimizing</Link>
            <Link to="/about" className="hero-btn-large secondary">Learn More</Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="home-stats" ref={metricsRef}>
        <div className="stats-grid">
          <div className="stat-box">
            <h4>{animatedMetrics.tonsCollected}T</h4>
            <p>Waste Collected</p>
          </div>
          <div className="stat-box">
            <h4>{animatedMetrics.fuelSaved}L</h4>
            <p>Fuel Saved (AI Routes)</p>
          </div>
          <div className="stat-box">
            <h4>{animatedMetrics.efficiency}%</h4>
            <p>Fleet Efficiency</p>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="home-features">
        <div className="section-header">
          <h2>Core Capabilities</h2>
          <p>Everything you need to orchestrate a modern fleet, wrapped in an elegant and secure platform.</p>
        </div>

        <div className="bento-grid">
          
          <div className="bento-item span-8">
            <div className="bento-icon" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>
              <i className="fas fa-route"></i>
            </div>
            <h3>Smart Fleet Routing</h3>
            <p>Our proprietary algorithms calculate the absolute shortest paths for your drivers, adapting to traffic, roadblocks, and live bin fill-levels to save hours of driving time every single day.</p>
          </div>

          <div className="bento-item span-4">
            <div className="bento-icon" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
              <i className="fas fa-chart-line"></i>
            </div>
            <h3>Real-Time Analytics</h3>
            <p>Monitor collection rates, fuel consumption, and fleet performance through stunning interactive dashboards.</p>
          </div>

          <div className="bento-item span-4">
            <div className="bento-icon" style={{background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'}}>
              <i className="fas fa-users-cog"></i>
            </div>
            <h3>Role-Based Access</h3>
            <p>Dedicated portals for Admins, Managers, and Drivers ensure everyone has the exact tools they need.</p>
          </div>

          <div className="bento-item span-8">
            <div className="bento-icon" style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}>
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3>Secure & Reliable</h3>
            <p>Built on a scalable, cloud-native architecture. Your data is encrypted end-to-end, and our 99.9% uptime guarantee means your operations never skip a beat.</p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{textAlign: 'center', padding: '40px', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '60px'}}>
        <p>&copy; 2026 EcoSync AI Waste Optimizer. All rights reserved.</p>
      </footer>

    </div>
  );
}

export default Home;
