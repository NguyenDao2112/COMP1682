import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { reportsAPI, binsAPI } from "../../services/api";

const SAMPLE_REPORTS = [
  { id: 1, type: "overflow", title: "Bin overflow at Hai Chau", status: "resolved", created_at: new Date(Date.now() - 7200000).toISOString(), location: "Hai Chau District", bin_id: "DN-A001", description: "Bin is overflowing and needs immediate collection." },
  { id: 2, type: "damage", title: "Damaged bin lid", status: "processing", created_at: new Date(Date.now() - 18000000).toISOString(), location: "Thanh Khe District", bin_id: "DN-B003", description: "The lid is broken and cannot close properly." },
  { id: 3, type: "suggestion", title: "Need more recycling bins", status: "processing", created_at: new Date(Date.now() - 86400000).toISOString(), location: "Son Tra District", bin_id: null, description: "The area needs more recycling bins." },
  { id: 4, type: "overflow", title: "Overflowing garbage near park", status: "resolved", created_at: new Date(Date.now() - 172800000).toISOString(), location: "Lien Chieu District", bin_id: "DN-C002", description: "Garbage is scattered around the bin near the park." },
  { id: 5, type: "illegal_dumping", title: "Illegal dumping reported", status: "new", created_at: new Date(Date.now() - 259200000).toISOString(), location: "Ngu Hanh Son District", bin_id: null, description: "Someone dumped construction waste on the roadside." },
];

function formatTimeAgo(dateStr) {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function Status() {
  const { darkMode } = useTheme();
  const [reports, setReports] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("reports");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const [reportsResult, binsResult] = await Promise.allSettled([
        reportsAPI.getAll({ user_id: user.id }),
        binsAPI.getForMap(),
      ]);

      const reportsData = reportsResult.status === "fulfilled" ? reportsResult.value : [];
      const mappedReports = reportsData.map(r => ({
        ...r,
        type: r.category || "suggestion",
        description: r.content || "",
        location: r.address || "N/A",
        status: r.status === "resolved" ? "resolved" : r.status === "reviewed" ? "processing" : "new"
      }));
      setReports(mappedReports.length > 0 ? mappedReports : SAMPLE_REPORTS);

      const binsData = binsResult.status === "fulfilled" ? binsResult.value : [];
      setBins(binsData);
    } catch {
      setError("Failed to load data. Please try again.");
      setReports(SAMPLE_REPORTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStatusColor = (status) => {
    if (status === "resolved") return "green";
    if (status === "processing") return "yellow";
    return "red";
  };

  const getBinStatusColor = (fillLevel) => {
    if (fillLevel >= 80) return "red";
    if (fillLevel >= 50) return "yellow";
    return "green";
  };

  const getReportIcon = (type) => {
    const map = { overflow: "fa-exclamation-triangle", damage: "fa-wrench", suggestion: "fa-lightbulb", illegal_dumping: "fa-ban" };
    return map[type] || "fa-flag";
  };

  const filteredReports = reports.filter(r => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const filteredBins = bins.filter(bin => {
    if (filter === "all") return true;
    if (filter === "full" || filter === "new") return bin.fill_level >= 80;
    if (filter === "warning" || filter === "processing") return bin.fill_level >= 50 && bin.fill_level < 80;
    if (filter === "normal" || filter === "resolved") return bin.fill_level < 50;
    return true;
  });

  if (loading) {
    return (
      <div className="status-page">
        <div className="page-loading">
          <div className="spinner"></div>
          <p>Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-page">
      <div className="page-header">
        <h1>My Reports</h1>
        <p>Track your submitted reports and view collection status</p>
      </div>

      {error && (
        <div className="page-error">
          <i className="fas fa-exclamation-triangle"></i> {error}
          <button className="btn-retry" onClick={fetchData}><i className="fas fa-redo"></i> Retry</button>
        </div>
      )}

      {/* View Toggle */}
      <div className="filter-tabs">
        <button className={`tab ${view === "reports" ? "active" : ""}`} onClick={() => { setView("reports"); setFilter("all"); }}>
          <i className="fas fa-clipboard-list"></i> My Reports ({reports.length})
        </button>
        <button className={`tab ${view === "bins" ? "active" : ""}`} onClick={() => { setView("bins"); setFilter("all"); }}>
          <i className="fas fa-trash-alt"></i> Bin Status ({bins.length})
        </button>
      </div>

      {/* Filter Tabs */}
      {view === "reports" ? (
        <div className="filter-tabs">
          <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All ({reports.length})</button>
          <button className={`tab ${filter === "new" ? "active" : ""}`} onClick={() => setFilter("new")}>
            <span className="status-dot red"></span> New ({reports.filter(r => r.status === "new").length})
          </button>
          <button className={`tab ${filter === "processing" ? "active" : ""}`} onClick={() => setFilter("processing")}>
            <span className="status-dot yellow"></span> Processing ({reports.filter(r => r.status === "processing").length})
          </button>
          <button className={`tab ${filter === "resolved" ? "active" : ""}`} onClick={() => setFilter("resolved")}>
            <span className="status-dot green"></span> Resolved ({reports.filter(r => r.status === "resolved").length})
          </button>
        </div>
      ) : (
        <div className="filter-tabs">
          <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All Bins ({bins.length})</button>
          <button className={`tab ${filter === "full" ? "active" : ""}`} onClick={() => setFilter("full")}>
            <span className="status-dot red"></span> Full ({bins.filter(b => b.fill_level >= 80).length})
          </button>
          <button className={`tab ${filter === "warning" ? "active" : ""}`} onClick={() => setFilter("warning")}>
            <span className="status-dot yellow"></span> Warning ({bins.filter(b => b.fill_level >= 50 && b.fill_level < 80).length})
          </button>
          <button className={`tab ${filter === "normal" ? "active" : ""}`} onClick={() => setFilter("normal")}>
            <span className="status-dot green"></span> Normal ({bins.filter(b => b.fill_level < 50).length})
          </button>
        </div>
      )}

      {/* Stats */}
      {view === "reports" ? (
        <div className="status-stats">
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-clipboard-list"></i></div>
            <div className="stat-content"><h3>{reports.length}</h3><p>Total Reports</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><i className="fas fa-clock"></i></div>
            <div className="stat-content"><h3>{reports.filter(r => r.status === "processing" || r.status === "new").length}</h3><p>In Progress</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active"><i className="fas fa-check-circle"></i></div>
            <div className="stat-content"><h3>{reports.filter(r => r.status === "resolved").length}</h3><p>Resolved</p></div>
          </div>
        </div>
      ) : (
        <div className="status-stats">
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-trash-alt"></i></div>
            <div className="stat-content"><h3>{bins.length}</h3><p>Total Bins</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><i className="fas fa-exclamation-triangle"></i></div>
            <div className="stat-content"><h3>{bins.filter(b => b.fill_level >= 80).length}</h3><p>Need Collection</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active"><i className="fas fa-check-circle"></i></div>
            <div className="stat-content"><h3>{bins.filter(b => b.fill_level < 50).length}</h3><p>Normal</p></div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {view === "reports" ? (
        <div className="bins-grid">
          {filteredReports.map((report) => (
            <div key={report.id} className="bin-card">
              <div className="bin-header">
                <span className="bin-id">
                  <i className={`fas ${getReportIcon(report.type)}`} style={{ marginRight: 8, color: getStatusColor(report.status) === "green" ? "#22C55E" : getStatusColor(report.status) === "yellow" ? "#F59E0B" : "#EF4444" }}></i>
                  {report.title}
                </span>
                <span className={`status-indicator ${getStatusColor(report.status)}`}>
                  {report.status === "resolved" ? "Resolved" : report.status === "processing" ? "Processing" : "New"}
                </span>
              </div>
              {report.description && <p style={{ fontSize: 13, marginBottom: 8, opacity: 0.7, lineHeight: 1.5 }}>{report.description}</p>}
              <div className="bin-info">
                {report.bin_id && <p><i className="fas fa-trash-alt"></i> Bin: {report.bin_id}</p>}
                <p><i className="fas fa-map-marker-alt"></i> {report.location || "N/A"}</p>
                <p><i className="fas fa-clock"></i> {formatTimeAgo(report.created_at)}</p>
              </div>
              <div className="bin-actions">
                <Link to="/user/feedback" className="btn-report" style={{ textDecoration: "none" }}>
                  <i className="fas fa-plus"></i> New Report
                </Link>
              </div>
            </div>
          ))}
          {filteredReports.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <i className="fas fa-inbox"></i>
              <p>No reports match your filter</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bins-grid">
          {filteredBins.slice(0, 20).map((bin) => (
            <div key={bin.id || bin.bin_id} className="bin-card">
              <div className="bin-header">
                <span className="bin-id">Bin #{bin.bin_id}</span>
                <span className={`status-indicator ${getBinStatusColor(bin.fill_level)}`}>{bin.fill_level?.toFixed(0)}%</span>
              </div>
              <div className="bin-progress">
                <div className={`progress-bar ${getBinStatusColor(bin.fill_level)}`} style={{ width: `${bin.fill_level}%` }}></div>
              </div>
              <div className="bin-info">
                <p><i className="fas fa-tag"></i> {bin.bin_type || bin.type || "General"}</p>
                <p><i className="fas fa-map-marker-alt"></i> {bin.address || "N/A"}</p>
              </div>
              <div className="bin-actions">
                <Link to="/user/feedback" className="btn-report" style={{ textDecoration: "none" }}>
                  <i className="fas fa-flag"></i> Report Issue
                </Link>
              </div>
            </div>
          ))}
          {filteredBins.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <i className="fas fa-inbox"></i>
              <p>No bins match your filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Status;
