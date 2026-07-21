import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { feedbackAPI } from "../../services/api";

const Feedback = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    type: "overflow",
    title: "",
    description: "",
    location: "",
    bin_id: "",
    priority: "normal"
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [myRecentReports, setMyRecentReports] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await feedbackAPI.getAll({ user_id: user.id });
        const mappedData = data.map(r => ({
          ...r,
          status: r.status === "resolved" ? "resolved" : r.status === "reviewed" ? "processing" : "new"
        }));
        setMyRecentReports(mappedData.slice(0, 3));
      } catch {
        setMyRecentReports([
          { id: 1, title: "Bin overflow at District 5", created_at: new Date(Date.now() - 7200000).toISOString(), status: "processing" },
          { id: 2, title: "Suggested new collection time", created_at: new Date(Date.now() - 86400000).toISOString(), status: "resolved" },
          { id: 3, title: "Great service in District 2", created_at: new Date(Date.now() - 172800000).toISOString(), status: "resolved" },
        ]);
      }
    };
    fetchRecent();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        content: formData.description,
        category: formData.type,
        address: formData.location || null,
        image_url: null,
        latitude: null,
        longitude: null
      };

      await feedbackAPI.create(payload);

      setToast({ type: "success", message: "Report submitted successfully! Admin will review it shortly." });
      setFormData({ type: "overflow", title: "", description: "", location: "", bin_id: "", priority: "normal" });
      setImage(null);
      setImagePreview(null);

      const data = await feedbackAPI.getAll({ user_id: user.id });
      const mappedData = data.map(r => ({
        ...r,
        status: r.status === "resolved" ? "resolved" : r.status === "reviewed" ? "processing" : "new"
      }));
      setMyRecentReports(mappedData.slice(0, 3));
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to submit report. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const reportTypes = [
    { value: "overflow", label: "Bin Overflow", icon: "fa-exclamation-triangle" },
    { value: "damage", label: "Damaged Bin", icon: "fa-wrench" },
    { value: "illegal_dumping", label: "Illegal Dumping", icon: "fa-ban" },
    { value: "suggestion", label: "Suggestion", icon: "fa-lightbulb" },
    { value: "complaint", label: "Complaint", icon: "fa-comment-dots" },
    { value: "compliment", label: "Compliment", icon: "fa-star" },
  ];

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Recently";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="feedback-page">
      {/* Toast */}
      {toast && (
        <div className={`fb-toast fb-toast-${toast.type}`}>
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><i className="fas fa-times"></i></button>
        </div>
      )}

      <div className="page-header">
        <h1>Report Issue</h1>
        <p>Help us keep Da Nang clean - report waste issues in your area</p>
      </div>

      <div className="feedback-content">
        <form onSubmit={handleSubmit} className={`feedback-form ${darkMode ? "dark" : "light"}`}>
          <div className="form-section">
            <h3>Report Type</h3>
            <div className="type-options">
              {reportTypes.map((type) => (
                <label key={type.value} className={`type-option ${formData.type === type.value ? "selected" : ""}`}>
                  <input type="radio" name="type" value={type.value} checked={formData.type === type.value} onChange={handleChange} />
                  <i className={`fas ${type.icon} type-icon`}></i>
                  <span className="type-label">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Details</h3>
            <div className="form-group">
              <label>Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Brief summary (e.g., Bin overflow at Hai Chau market)" required />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the issue in detail - what you see, how urgent it is..." rows="5" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Hai Chau District, near market" />
              </div>
              <div className="form-group">
                <label>Bin ID (if known)</label>
                <input type="text" name="bin_id" value={formData.bin_id} onChange={handleChange} placeholder="e.g., DN-A001" />
              </div>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low - General feedback</option>
                <option value="normal">Normal - Needs attention</option>
                <option value="high">High - Urgent issue</option>
                <option value="critical">Critical - Emergency / Health hazard</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Attach Photo (Optional)</h3>
            <div className="image-upload">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" className="remove-image" onClick={() => { setImage(null); setImagePreview(null); }}>×</button>
                </div>
              ) : (
                <label className={`upload-area ${darkMode ? "dark" : ""}`}>
                  <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                  <i className="fas fa-camera upload-icon"></i>
                  <span className="upload-text">Click to upload photo</span>
                  <span className="upload-hint">JPG, PNG up to 5MB</span>
                </label>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/user/dashboard")}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? (<><span className="fb-spinner"></span> Submitting...</>) : (<><i className="fas fa-paper-plane"></i> Submit Report</>)}
            </button>
          </div>
        </form>

        <div className="feedback-sidebar">
          <div className={`sidebar-card ${darkMode ? "dark" : "light"}`}>
            <h3><i className="fas fa-history"></i> Your Recent Reports</h3>
            <div className="recent-list">
              {myRecentReports.map((report) => (
                <div key={report.id} className="recent-item">
                  <div className={`recent-status-dot ${report.status}`}></div>
                  <div className="recent-content">
                    <p>{report.title}</p>
                    <div className="recent-meta">
                      <span>{formatTimeAgo(report.created_at)}</span>
                      <span className={`recent-badge ${report.status}`}>
                        {report.status === "resolved" ? "Resolved" : report.status === "processing" ? "Processing" : "New"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {myRecentReports.length === 0 && <p className="no-reports">No reports yet</p>}
            </div>
          </div>

          <div className={`sidebar-card contact-card ${darkMode ? "dark" : ""}`}>
            <h3>Need Immediate Help?</h3>
            <p>For urgent waste emergencies, contact our hotline:</p>
            <div className="contact-info">
              <i className="fas fa-phone-alt"></i>
              <strong>1900-xxxx</strong>
            </div>
            <p className="contact-hours">Available 24/7</p>
          </div>
        </div>
      </div>

      <style>{`
        .feedback-page { padding: 0; position: relative; }

        .fb-toast {
          position: fixed; top: 24px; right: 24px; display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; border-radius: 12px; font-size: 14px; font-weight: 500; z-index: 9999;
          animation: fadeIn 0.3s ease; box-shadow: 0 8px 32px rgba(0,0,0,0.15); max-width: 420px;
        }
        .fb-toast-success { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
        .fb-toast-error { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
        .fb-toast button { background: none; border: none; color: inherit; cursor: pointer; opacity: 0.6; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .feedback-content { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }

        .feedback-form { border-radius: 16px; padding: 28px; transition: background 0.3s, box-shadow 0.3s; }
        .feedback-form.light { background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .feedback-form.dark { background: #1E293B; box-shadow: 0 2px 12px rgba(0,0,0,0.2); }

        .form-section { margin-bottom: 28px; }
        .form-section h3 { font-size: 16px; font-weight: 600; margin: 0 0 16px 0; }
        .feedback-form.light .form-section h3 { color: #0F172A; }
        .feedback-form.dark .form-section h3 { color: #F1F5F9; }

        .type-options { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
        .type-option { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 8px; border-radius: 10px; cursor: pointer; transition: all 0.2s; text-align: center; }
        .feedback-form.light .type-option { border: 2px solid #E2E8F0; }
        .feedback-form.dark .type-option { border: 2px solid #334155; }
        .type-option:hover { border-color: #22C55E !important; }
        .type-option.selected { border-color: #22C55E !important; background: rgba(34,197,94,0.08); }
        .type-option input { display: none; }
        .type-icon { font-size: 22px; color: #22C55E; }
        .type-label { font-size: 12px; font-weight: 600; }
        .feedback-form.light .type-label { color: #0F172A; }
        .feedback-form.dark .type-label { color: #CBD5E1; }

        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
        .feedback-form.light .form-group label { color: #334155; }
        .feedback-form.dark .form-group label { color: #94A3B8; }

        .form-group input, .form-group textarea, .form-group select {
          width: 100%; padding: 11px 14px; border-radius: 10px; font-size: 14px; transition: border-color 0.2s; font-family: inherit;
        }
        .feedback-form.light .form-group input, .feedback-form.light .form-group textarea, .feedback-form.light .form-group select { background: #F8FAFC; border: 1px solid #E2E8F0; color: #0F172A; }
        .feedback-form.dark .form-group input, .feedback-form.dark .form-group textarea, .feedback-form.dark .form-group select { background: #0F172A; border: 1px solid #334155; color: #F1F5F9; }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus { outline: none; border-color: #22C55E; }
        .feedback-form.dark .form-group input::placeholder, .feedback-form.dark .form-group textarea::placeholder { color: #64748B; }
        .form-group textarea { resize: vertical; min-height: 100px; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .image-upload { margin-top: 8px; }
        .upload-area { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .upload-area:not(.dark) { border: 2px dashed #E2E8F0; }
        .upload-area.dark { border: 2px dashed #334155; }
        .upload-area:hover { border-color: #22C55E; }
        .upload-icon { font-size: 28px; color: #22C55E; margin-bottom: 8px; }
        .upload-text { font-weight: 600; font-size: 14px; }
        .feedback-form.light .upload-text { color: #334155; }
        .feedback-form.dark .upload-text { color: #94A3B8; }
        .upload-hint { font-size: 11px; color: #94A3B8; margin-top: 4px; }

        .image-preview { position: relative; display: inline-block; }
        .image-preview img { max-width: 200px; border-radius: 10px; }
        .remove-image { position: absolute; top: -8px; right: -8px; width: 26px; height: 26px; border-radius: 50%; background: #EF4444; color: #fff; border: none; cursor: pointer; font-size: 16px; line-height: 1; }

        .form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; }
        .feedback-form.light .form-actions { border-top: 1px solid #E2E8F0; }
        .feedback-form.dark .form-actions { border-top: 1px solid #334155; }

        .btn-cancel { padding: 11px 22px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 14px; }
        .feedback-form.light .btn-cancel { background: transparent; border: 1px solid #E2E8F0; color: #64748B; }
        .feedback-form.dark .btn-cancel { background: transparent; border: 1px solid #334155; color: #94A3B8; }
        .btn-cancel:hover { border-color: #EF4444; color: #EF4444; }

        .btn-submit { padding: 11px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; background: linear-gradient(135deg, #22C55E, #16A34A); border: none; color: #fff; display: flex; align-items: center; gap: 8px; font-size: 14px; }
        .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(34,197,94,0.4); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .fb-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .feedback-sidebar { display: flex; flex-direction: column; gap: 16px; }
        .sidebar-card { border-radius: 16px; padding: 22px; transition: background 0.3s; }
        .sidebar-card.light { background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .sidebar-card.dark { background: #1E293B; box-shadow: 0 2px 12px rgba(0,0,0,0.2); }
        .sidebar-card h3 { font-size: 15px; font-weight: 600; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
        .sidebar-card.light h3 { color: #0F172A; }
        .sidebar-card.dark h3 { color: #F1F5F9; }
        .sidebar-card h3 i { color: #22C55E; }

        .recent-list { display: flex; flex-direction: column; gap: 10px; }
        .recent-item { display: flex; gap: 12px; padding: 12px; border-radius: 10px; }
        .sidebar-card.light .recent-item { background: #F8FAFC; }
        .sidebar-card.dark .recent-item { background: rgba(255,255,255,0.04); }

        .recent-status-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .recent-status-dot.resolved { background: #22C55E; }
        .recent-status-dot.processing { background: #F59E0B; }
        .recent-status-dot.new { background: #2563EB; }

        .recent-content { flex: 1; }
        .recent-content p { margin: 0; font-size: 13px; font-weight: 500; }
        .sidebar-card.light .recent-content p { color: #0F172A; }
        .sidebar-card.dark .recent-content p { color: #CBD5E1; }

        .recent-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
        .recent-meta span { font-size: 11px; color: #94A3B8; }
        .recent-badge { padding: 2px 8px; border-radius: 6px; font-weight: 600; }
        .recent-badge.resolved { background: rgba(34,197,94,0.15); color: #16A34A; }
        .recent-badge.processing { background: rgba(245,158,11,0.15); color: #D97706; }
        .recent-badge.new { background: rgba(37,99,235,0.15); color: #2563EB; }

        .no-reports { font-size: 13px; color: #94A3B8; text-align: center; padding: 16px; }

        .contact-card { background: linear-gradient(135deg, #22C55E, #16A34A) !important; color: #fff !important; }
        .contact-card h3, .contact-card p { color: #fff !important; }
        .contact-card h3 i { color: #fff !important; }
        .contact-info { display: flex; align-items: center; gap: 10px; margin: 16px 0; }
        .contact-info i { font-size: 20px; }
        .contact-info strong { font-size: 22px; }
        .contact-hours { font-size: 13px; opacity: 0.85; }

        @media (max-width: 768px) {
          .feedback-content { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Feedback;
