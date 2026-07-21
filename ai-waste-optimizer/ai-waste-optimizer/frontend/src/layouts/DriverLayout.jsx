import React, { useMemo } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import "../css/DriverLayout.css";

function DriverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { darkMode, toggleTheme } = useTheme();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || user.role !== "driver") navigate("/login");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => {
    const segments = location.pathname.split("/").filter(Boolean);
    return (segments[1] || "dashboard") === path;
  };

  return (
    <div className={`driver-layout ${darkMode ? "dark" : "light"}`}>
      <header className="driver-header">
        <div className="driver-logo">
          <div className="driver-logo-icon"><i className="fas fa-leaf"></i></div>
          <span>AI Waste</span>
        </div>
        <nav className="driver-nav">
          <Link to="/driver/dashboard" className={isActive("dashboard") ? "active" : ""}>
            <i className="fas fa-home"></i> Dashboard
          </Link>
          <Link to="/driver/route" className={isActive("route") ? "active" : ""}>
            <i className="fas fa-route"></i> My Route
          </Link>
        </nav>
        <div className="driver-actions">
          <button className="driver-theme-btn" onClick={toggleTheme}>
            <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`}></i>
          </button>
          <button className="driver-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>
      <main className="driver-main">
        <Outlet />
      </main>
    </div>
  );
}

export default DriverLayout;
