import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import "../css/AdminLayout.css";

const NAV_ITEMS = [
  { path: "dashboard", icon: "fa-chart-line", label: "Live Dashboard", section: "OPERATIONS" },
  { path: "routes", icon: "fa-route", label: "Route Dispatch", section: "OPERATIONS" },
  { path: "fleet", icon: "fa-truck-moving", label: "Fleet Management", section: "MANAGEMENT" },
  { path: "analytics", icon: "fa-file-pdf", label: "Analytics & Reports", section: "MANAGEMENT" },
];

function ManagerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { darkMode, toggleTheme } = useTheme();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || user.role !== "manager") {
      navigate("/login");
    }
  }, [navigate, user.role]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => {
    const segments = location.pathname.split("/").filter(Boolean);
    return (segments[1] || "dashboard") === path;
  };

  const grouped = {};
  NAV_ITEMS.forEach(item => {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  });

  return (
    <div className={`admin-layout manager-layout ${darkMode ? "dark" : "light"}`}>
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon"><i className="fas fa-leaf"></i></div>
            <div className="logo-text">
              <h1>AI Waste</h1>
              <span>Manager Panel</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(grouped).map(([section, items]) => (
            <div className="nav-section" key={section}>
              <span className="nav-section-title">{section}</span>
              {items.map((item) => (
                <Link
                  key={item.path}
                  to={`/manager/${item.path}`}
                  className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                >
                  <div className="nav-item-icon">
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <span className="nav-item-text">{item.label}</span>
                  {isActive(item.path) && <div className="nav-active-indicator"></div>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-theme-btn" onClick={toggleTheme}>
            <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`}></i>
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <Link to="/about" className="nav-item">
            <div className="nav-item-icon"><i className="fas fa-info-circle"></i></div>
            <span className="nav-item-text">About</span>
          </Link>
          <div className="nav-item logout" onClick={handleLogout}>
            <div className="nav-item-icon"><i className="fas fa-sign-out-alt"></i></div>
            <span className="nav-item-text">Logout</span>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default ManagerLayout;
