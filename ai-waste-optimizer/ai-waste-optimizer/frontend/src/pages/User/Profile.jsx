import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    username: user.username || ""
  });
  
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Update user in localStorage
    const updatedUser = { ...user, ...formData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setMessage("Profile updated successfully!");
    setEditing(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account information</p>
      </div>

      {message && <div className="success-message">{message}</div>}

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar-large">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="profile-info">
              <h2>{user.full_name || user.username}</h2>
              <span className={`role-badge ${user.role}`}>{user.role}</span>
              <p>{user.email}</p>
            </div>
            <button 
              className="btn-edit" 
              onClick={() => setEditing(!editing)}
            >
              <i className={`fas ${editing ? "fa-times" : "fa-edit"}`}></i>
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!editing}
                rows="3"
              />
            </div>

            {editing && (
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  <i className="fas fa-save"></i> Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Account Settings */}
        <div className="settings-card">
          <h3>Account Settings</h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <i className="fas fa-bell"></i>
              <div>
                <h4>Notifications</h4>
                <p>Receive alerts for bin collection</p>
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <i className="fas fa-envelope"></i>
              <div>
                <h4>Email Updates</h4>
                <p>Receive weekly reports</p>
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item danger">
            <div className="setting-info">
              <i className="fas fa-sign-out-alt"></i>
              <div>
                <h4>Logout</h4>
                <p>Sign out from your account</p>
              </div>
            </div>
            <button className="btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .profile-page {
          padding: 0;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 8px 0;
        }

        .page-header p {
          color: #666;
          margin: 0;
        }

        .success-message {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid #4caf50;
          color: #4caf50;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .profile-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .profile-card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #eee;
        }

        .avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: #ccc;
        }

        .profile-info {
          flex: 1;
        }

        .profile-info h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
        }

        .profile-info p {
          color: #666;
          margin: 4px 0 0 0;
        }

        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          margin-bottom: 8px;
        }

        .role-badge.admin {
          background: rgba(244, 67, 54, 0.1);
          color: #f44336;
        }

        .role-badge.user {
          background: rgba(33, 150, 243, 0.1);
          color: #2196f3;
        }

        .role-badge.manager {
          background: rgba(255, 152, 0, 0.1);
          color: #ff9800;
        }

        .role-badge.driver {
          background: rgba(156, 39, 176, 0.1);
          color: #9c27b0;
        }

        .btn-edit {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #ddd;
          border-radius: 6px;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-edit:hover {
          border-color: #00E676;
          color: #00E676;
        }

        .profile-form {
          display: grid;
          gap: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #1a1a2e;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          background: #f9f9f9;
        }

        .form-group input:disabled,
        .form-group textarea:disabled {
          background: #f5f5f5;
          color: #666;
          cursor: not-allowed;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #00E676;
        }

        .form-actions {
          padding-top: 16px;
        }

        .btn-primary {
          padding: 12px 24px;
          background: #00E676;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary:hover {
          background: #00c853;
        }

        .settings-card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          height: fit-content;
        }

        .settings-card h3 {
          margin: 0 0 20px 0;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid #eee;
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-item.danger .btn-danger {
          background: #f44336;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .setting-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .setting-info i {
          font-size: 20px;
          color: #666;
        }

        .setting-info h4 {
          margin: 0;
          font-size: 14px;
        }

        .setting-info p {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #999;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.3s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #00E676;
        }

        input:checked + .slider:before {
          transform: translateX(24px);
        }

        @media (max-width: 768px) {
          .profile-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Profile;
