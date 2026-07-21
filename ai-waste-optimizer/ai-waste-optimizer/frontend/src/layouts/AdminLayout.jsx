import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "../css/AdminStyles.css";

function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div className="admin-layout-container">
      {/* Sidebar Command Menu */}
      <aside className="cyber-sidebar">
        <div className="admin-sidebar-header">
          <i className="fas fa-globe"></i>
          <h2>AI CORE</h2>
        </div>

        <div className="admin-nav-group">Command Center</div>
        <NavLink to="/admin" end className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-satellite-dish"></i> System Health
        </NavLink>
        
        <div className="admin-nav-group">Operations</div>
        <NavLink to="/admin/fleet" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-truck-moving"></i> Global Fleet
        </NavLink>
        <NavLink to="/admin/routes" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-project-diagram"></i> Route Matrix
        </NavLink>
        
        <div className="admin-nav-group">Administration</div>
        <NavLink to="/admin/users" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-user-shield"></i> Access Control
        </NavLink>
        <NavLink to="/admin/settings" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-microchip"></i> AI Config
        </NavLink>
        <NavLink to="/admin/reports" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-file-invoice-dollar"></i> Global Audit
        </NavLink>

        <div style={{marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px'}}>
          <a href="#" onClick={handleLogout} className="admin-nav-item" style={{color: '#f43f5e'}}>
            <i className="fas fa-power-off"></i> Terminate Session
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-content">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <span>Global Overseer Panel</span>
            <div className="admin-system-status">
              <div className="status-dot"></div> ALL SYSTEMS NOMINAL
            </div>
          </div>
          
          <div className="admin-profile">
            <div style={{textAlign: 'right'}}>
              <div style={{fontSize: '14px', fontWeight: '700', color: '#fff'}}>System Admin</div>
              <div style={{fontSize: '12px', color: 'var(--admin-text-muted)'}}>Clearance Level 5</div>
            </div>
            <div className="admin-avatar"><i className="fas fa-user-astronaut"></i></div>
          </div>
        </header>

        <main className="admin-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
