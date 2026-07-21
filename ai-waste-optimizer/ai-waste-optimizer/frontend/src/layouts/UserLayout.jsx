import React, { useState, useMemo } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import "../css/UserLayout.css";

const MENU_ITEMS = [
  { path: "dashboard", icon: "fa-home", label: "Dashboard" },
  { path: "reports", icon: "fa-clipboard-list", label: "My Reports" },
  { path: "feedback", icon: "fa-plus-circle", label: "Report Issue" },
  { path: "schedule", icon: "fa-calendar-alt", label: "Schedule" },
  { path: "profile", icon: "fa-cog", label: "Settings" },
];

const PAGE_TITLES = {
  dashboard: { title: "Dashboard", parent: null },
  reports: { title: "My Reports", parent: "Dashboard" },
  feedback: { title: "Report Issue", parent: "Dashboard" },
  schedule: { title: "Collection Schedule", parent: "Dashboard" },
  profile: { title: "Settings", parent: "Dashboard" },
};

function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleTheme } = useTheme();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const currentPage = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const page = segments[1] || "dashboard";
    return PAGE_TITLES[page] || { title: "Dashboard", parent: null };
  }, [location.pathname]);

  const isActive = (path) => {
    const segments = location.pathname.split("/").filter(Boolean);
    const currentPath = segments[1] || "dashboard";
    return currentPath === path;
  };

  return (
    <div className={`user-layout ${darkMode ? "dark" : "light"}`}>
      {/* Sidebar */}
      <aside className={`user-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Link to="/user/dashboard" className="sidebar-logo" onClick={() => setSidebarOpen(false)}>
            <div className="logo-icon"><i className="fas fa-leaf"></i></div>
            <div className="logo-text">
              <span className="logo-name">AI Waste</span>
              <span className="logo-sub">Citizen Portal</span>
            </div>
          </Link>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">MAIN MENU</div>
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={`/user/${item.path}`}
              className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <div className="sidebar-link-icon">
                <i className={`fas ${item.icon}`}></i>
              </div>
              <span>{item.label}</span>
              {isActive(item.path) && <div className="sidebar-active-bar"></div>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-theme-toggle" onClick={toggleTheme}>
            <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`}></i>
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {(user.full_name || user.username || "U").charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.full_name || user.username || "Citizen"}</span>
              <span className="sidebar-user-role">{user.role || "Citizen"}</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Area */}
      <div className="user-main-area">
        {/* Top Bar */}
        <header className="user-topbar">
          <div className="topbar-left">
            <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>
              <i className="fas fa-bars"></i>
            </button>
            <div className="topbar-breadcrumb">
              <Link to="/user/dashboard" className="breadcrumb-home">
                <i className="fas fa-home"></i>
              </Link>
              {currentPage.parent && (
                <>
                  <span className="breadcrumb-sep"><i className="fas fa-chevron-right"></i></span>
                  <span className="breadcrumb-parent">{currentPage.parent}</span>
                </>
              )}
              <span className="breadcrumb-sep"><i className="fas fa-chevron-right"></i></span>
              <span className="breadcrumb-current">{currentPage.title}</span>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="topbar-theme-btn" onClick={toggleTheme}>
              <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`}></i>
            </button>
            <Link to="/user/profile" className="topbar-user">
              <div className="topbar-avatar">
                {(user.full_name || user.username || "U").charAt(0).toUpperCase()}
              </div>
              <span className="topbar-user-name">{user.full_name || user.username || "Citizen"}</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="user-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default UserLayout;
