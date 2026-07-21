import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { driverAPI } from "../../services/api";
import "./Driver.css";

function DriverDashboard() {
  const navigate = useNavigate();
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token || user.role !== "driver") {
      navigate("/login");
    }
  }, [navigate]);

  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async (isFirstLoad) => {
      try {
        if (isFirstLoad) setInitialLoading(true);
        const data = await driverAPI.getRouteSequence();
        setRouteData(data);
      } catch (err) {
        console.error("[DriverDashboard] fetch error:", err);
      } finally {
        if (isFirstLoad) setInitialLoading(false);
      }
    };

    fetchRoute(true);
    
    // Auto-polling every 5 seconds to sync with Manager Route Dispatch
    const interval = setInterval(() => {
      fetchRoute(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (initialLoading) {
    return (
      <div className="driver-loading">
        <div className="spinner"></div>
        <p>Syncing Neural Route...</p>
      </div>
    );
  }

  return (
    <div className="driver-dashboard">
      <div className="driver-welcome">
        <h1>Welcome, Driver</h1>
        <p>Here's your assigned route for today</p>
      </div>

      {!routeData || !routeData.route || routeData.route.length === 0 ? (
        <div className="empty-routes">
          <i className="fas fa-check-circle"></i>
          <p>No pending routes. All tasks completed!</p>
        </div>
      ) : (
        <>
          <div className="driver-stats">
            <div className="driver-stat-card">
              <div className="stat-icon">
                <i className="fas fa-route"></i>
              </div>
              <div className="stat-info">
                <h3>1</h3>
                <p>Assigned Route</p>
              </div>
            </div>
            <div className="driver-stat-card">
              <div className="stat-icon success">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="stat-info">
                <h3>{routeData.total_stops}</h3>
                <p>Total Stops</p>
              </div>
            </div>
            <div className="driver-stat-card">
              <div className="stat-icon warning">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-info">
                <h3>{routeData.completed_stops}</h3>
                <p>Completed</p>
              </div>
            </div>
          </div>

          <div className="routes-section">
            <h2>Current Route: {routeData.route_id}</h2>
            <div className="route-card">
              <div className="route-info">
                <h3>{routeData.district || "Hai Chau, Da Nang"}</h3>
                <p><i className="fas fa-map-marker-alt"></i> {routeData.total_stops} stops</p>
                <p><i className="fas fa-signal"></i> Status: {routeData.status}</p>
                {routeData.vehicle_id && (
                  <p><i className="fas fa-truck"></i> Vehicle: {routeData.vehicle_id}</p>
                )}
              </div>
              <div className="route-actions">
                <Link to="/driver/route" className="btn-start">
                  <i className="fas fa-play"></i> Start Route
                </Link>
              </div>
            </div>
          </div>

          <div className="activity-section">
            <h2>Stops Preview</h2>
            <div className="activity-list">
              {(routeData.route || []).slice(0, 3).map((bin, idx) => (
                <div key={bin.id} className="activity-item">
                  <div className={`activity-icon ${bin.collection_status === 'completed' ? 'success' : ''}`}>
                    <i className={`fas ${bin.collection_status === 'completed' ? 'fa-check' : 'fa-map-marker-alt'}`}></i>
                  </div>
                  <div className="activity-content">
                    <p>Stop {idx + 1}: {bin.location_name}</p>
                    <span>Fill: {bin.current_fill_level}% | {bin.bin_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DriverDashboard;
