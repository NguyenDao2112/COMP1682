import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../../contexts/ThemeContext";
import { binsAPI, reportsAPI, routesAPI } from "../../services/api";
import "./Dashboard.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const getMarkerIcon = (fillLevel) => {
  let color = "#22C55E";
  if (fillLevel >= 80) color = "#EF4444";
  else if (fillLevel >= 50) color = "#F59E0B";
  return L.divIcon({
    className: "citizen-marker",
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;"><i class="fas fa-trash" style="color:white;font-size:12px;"></i></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const DANANG_CENTER = [16.0544, 108.2022];

const SAMPLE_REPORTS = [
  { id: 1, type: "overflow", title: "Bin overflow at Hai Chau", status: "resolved", created_at: new Date(Date.now() - 7200000).toISOString(), location: "Hai Chau District", bin_id: "DN-A001" },
  { id: 2, type: "damage", title: "Damaged bin lid", status: "processing", created_at: new Date(Date.now() - 18000000).toISOString(), location: "Thanh Khe District", bin_id: "DN-B003" },
  { id: 3, type: "suggestion", title: "Need more recycling bins", status: "processing", created_at: new Date(Date.now() - 86400000).toISOString(), location: "Son Tra District", bin_id: null },
  { id: 4, type: "overflow", title: "Overflowing garbage near park", status: "resolved", created_at: new Date(Date.now() - 172800000).toISOString(), location: "Lien Chieu District", bin_id: "DN-C002" },
  { id: 5, type: "illegal_dumping", title: "Illegal dumping reported", status: "new", created_at: new Date(Date.now() - 259200000).toISOString(), location: "Ngu Hanh Son District", bin_id: null },
];

const SAMPLE_BINS = [
  { id: 1, bin_id: "DN-A001", lat: 16.0544, lng: 108.2022, fill_level: 45, bin_type: "General", address: "Hai Chau District" },
  { id: 2, bin_id: "DN-A002", lat: 16.0610, lng: 108.2100, fill_level: 78, bin_type: "General", address: "Hai Chau District" },
  { id: 3, bin_id: "DN-B001", lat: 16.0700, lng: 108.2200, fill_level: 92, bin_type: "Recycling", address: "Thanh Khe District" },
  { id: 4, bin_id: "DN-B002", lat: 16.0750, lng: 108.2150, fill_level: 23, bin_type: "General", address: "Thanh Khe District" },
  { id: 5, bin_id: "DN-C001", lat: 16.0800, lng: 108.2300, fill_level: 65, bin_type: "Organic", address: "Lien Chieu District" },
  { id: 6, bin_id: "DN-C002", lat: 16.0850, lng: 108.2250, fill_level: 88, bin_type: "General", address: "Lien Chieu District" },
  { id: 7, bin_id: "DN-D001", lat: 16.0400, lng: 108.1900, fill_level: 35, bin_type: "General", address: "Son Tra District" },
  { id: 8, bin_id: "DN-D002", lat: 16.0350, lng: 108.1850, fill_level: 95, bin_type: "Recycling", address: "Son Tra District" },
  { id: 9, bin_id: "DN-E001", lat: 16.0900, lng: 108.2400, fill_level: 52, bin_type: "General", address: "Ngu Hanh Son District" },
  { id: 10, bin_id: "DN-E002", lat: 16.0950, lng: 108.2450, fill_level: 70, bin_type: "Organic", address: "Ngu Hanh Son District" },
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

function CitizenDashboard() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bins, setBins] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [animatedMetrics, setAnimatedMetrics] = useState({
    tonsCollected: 0, co2Offset: 0, activeRoutes: 0, reportsSubmitted: 0,
  });
  const [impactMetrics, setImpactMetrics] = useState({
    tonsCollected: 1247, co2Offset: 3842, activeRoutes: 18, reportsSubmitted: 156,
  });

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");

      const [binsResult, reportsResult, statsResult, routesResult] = await Promise.allSettled([
        binsAPI.getForMap(),
        reportsAPI.getAll({ user_id: userObj.id }),
        reportsAPI.getStats(),
        routesAPI.getAll(),
      ]);

      // Bins
      const binsData = binsResult.status === "fulfilled" ? binsResult.value : [];
      setBins(binsData.length > 0 ? binsData : SAMPLE_BINS);

      // Reports (user's own reports)
      const reportsData = reportsResult.status === "fulfilled" ? reportsResult.value : [];
      setMyReports(reportsData.length > 0 ? reportsData : SAMPLE_REPORTS);

      // Impact metrics from stats
      if (statsResult.status === "fulfilled" && statsResult.value) {
        const s = statsResult.value;
        setImpactMetrics({
          tonsCollected: s.today_waste_collected || s.total_bins * 8 || 1247,
          co2Offset: Math.round((s.efficiency_score || 87) * 44) || 3842,
          activeRoutes: s.total_routes || s.active_bins || 18,
          reportsSubmitted: s.total_feedback || reportsData.length || 156,
        });
      }

      // Count reports from stats data for community count
      if (statsResult.status === "fulfilled" && statsResult.value) {
        const s = statsResult.value;
        setImpactMetrics(prev => ({
          ...prev,
          reportsSubmitted: s.total_feedback || s.pending_feedback ? (s.total_feedback || prev.reportsSubmitted) : prev.reportsSubmitted,
        }));
      }
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
      setBins(SAMPLE_BINS);
      setMyReports(SAMPLE_REPORTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Animate metrics on load
  useEffect(() => {
    if (!loading) {
      const duration = 1200;
      const steps = 40;
      const interval = duration / steps;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedMetrics({
          tonsCollected: Math.round(impactMetrics.tonsCollected * eased),
          co2Offset: Math.round(impactMetrics.co2Offset * eased),
          activeRoutes: Math.round(impactMetrics.activeRoutes * eased),
          reportsSubmitted: Math.round(impactMetrics.reportsSubmitted * eased),
        });
        if (step >= steps) clearInterval(timer);
      }, interval);
      return () => clearInterval(timer);
    }
  }, [loading]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setToast({ type: "error", message: "Geolocation is not supported by your browser" });
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationLoading(false);
        setToast({ type: "success", message: "Location updated! Showing nearby bins." });
      },
      () => {
        setLocationLoading(false);
        setToast({ type: "error", message: "Unable to retrieve your location" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleExport = (type) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (type === "reports") {
      csvContent += "ID,Type,Title,Status,Location\n";
      myReports.forEach((r) => {
        csvContent += `${r.id},${r.type},${r.title},${r.status},${r.location || ""}\n`;
      });
    } else if (type === "impact") {
      csvContent += "Metric,Value\n";
      csvContent += `Tons Collected,${impactMetrics.tonsCollected}\nCO2 Offset (kg),${impactMetrics.co2Offset}\nActive Routes,${impactMetrics.activeRoutes}\nReports Submitted,${impactMetrics.reportsSubmitted}\n`;
    }
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `citizen-${type}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
    setToast({ type: "success", message: `${type} data exported successfully!` });
  };

  const getStatusBadge = (status) => {
    const map = {
      resolved: { class: "badge-resolved", icon: "fa-check-circle", label: "Resolved" },
      processing: { class: "badge-processing", icon: "fa-spinner", label: "Processing" },
      new: { class: "badge-new", icon: "fa-clock", label: "New" },
    };
    return map[status] || map.new;
  };

  const getReportIcon = (type) => {
    const map = {
      overflow: "fa-exclamation-triangle", damage: "fa-wrench", suggestion: "fa-lightbulb",
      illegal_dumping: "fa-ban", general: "fa-comment-dots",
    };
    return map[type] || "fa-flag";
  };

  const nearbyBins = userLocation
    ? bins.map((b) => ({ ...b, distance: Math.sqrt(Math.pow(b.lat - userLocation[0], 2) + Math.pow(b.lng - userLocation[1], 2)) })).sort((a, b) => a.distance - b.distance).slice(0, 5)
    : bins.slice(0, 5);

  const resolvedCount = myReports.filter((r) => r.status === "resolved").length;
  const processingCount = myReports.filter((r) => r.status === "processing" || r.status === "new").length;

  if (loading) {
    return (
      <div className={`citizen-dashboard ${darkMode ? "dark" : "light"}`}>
        <div className="citizen-loading">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`citizen-dashboard ${darkMode ? "dark" : "light"}`}>
      {/* Toast */}
      {toast && (
        <div className={`citizen-toast toast-${toast.type}`}>
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><i className="fas fa-times"></i></button>
        </div>
      )}

      {/* Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1>Citizen Dashboard</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
            Welcome back! Monitor waste levels and report issues in your neighborhood.
          </p>
        </div>
        <div className="dash-header-right">
          <div className="dash-export-wrap">
            <button className="dash-icon-btn" onClick={() => setShowExportMenu(!showExportMenu)} title="Export Data" style={{ display: 'flex', gap: '8px', alignItems: 'center', width: 'auto', padding: '0 16px' }}>
              <i className="fas fa-download"></i>
              <span>Export</span>
            </button>
            {showExportMenu && (
              <div className="dash-export-menu" style={{ right: 0 }}>
                <button onClick={() => handleExport("reports")}><i className="fas fa-file-alt"></i> Export Reports</button>
                <button onClick={() => handleExport("impact")}><i className="fas fa-chart-bar"></i> Export Impact</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="dash-error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button className="btn-retry" onClick={fetchData}><i className="fas fa-redo"></i> Retry</button>
        </div>
      )}

      {/* Hero */}
      <div className="dash-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Welcome back, <span className="hero-name">{user.full_name || user.username || "Citizen"}</span></h2>
            <p className="hero-tagline">Your role in a cleaner city - every report counts</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{resolvedCount}</span>
              <span className="hero-stat-label">Resolved</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-value">{processingCount}</span>
              <span className="hero-stat-label">In Progress</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-value">{myReports.length}</span>
              <span className="hero-stat-label">Total Reports</span>
            </div>
          </div>
        </div>
        <div className="hero-decoration">
          <i className="fas fa-leaf hero-icon-1"></i>
          <i className="fas fa-recycle hero-icon-2"></i>
          <i className="fas fa-globe-asia hero-icon-3"></i>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dash-section">
        <h3 className="section-title"><i className="fas fa-bolt"></i> Quick Actions</h3>
        <div className="quick-actions">
          <Link to="/user/feedback" className="action-card action-report">
            <div className="action-icon"><i className="fas fa-plus-circle"></i></div>
            <div className="action-info">
              <h4>Report Issue</h4>
              <p>Report waste overflow, damage, or illegal dumping</p>
            </div>
            <i className="fas fa-arrow-right action-arrow"></i>
          </Link>
          <Link to="/user/status" className="action-card action-view">
            <div className="action-icon"><i className="fas fa-eye"></i></div>
            <div className="action-info">
              <h4>View Reports</h4>
              <p>Track status of your submitted reports</p>
            </div>
            <i className="fas fa-arrow-right action-arrow"></i>
          </Link>
          <Link to="/user/feedback" className="action-card action-feedback">
            <div className="action-icon"><i className="fas fa-comment-dots"></i></div>
            <div className="action-info">
              <h4>Give Feedback</h4>
              <p>Share suggestions to improve waste management</p>
            </div>
            <i className="fas fa-arrow-right action-arrow"></i>
          </Link>
        </div>
      </div>

      {/* Live Impact Metrics */}
      <div className="dash-section">
        <h3 className="section-title">
          <i className="fas fa-chart-line"></i> Live Impact Metrics
          <span className="live-dot"></span>
        </h3>
        <div className="impact-grid">
          <div className="impact-card">
            <div className="impact-icon tons"><i className="fas fa-weight-hanging"></i></div>
            <div className="impact-data">
              <span className="impact-value">{animatedMetrics.tonsCollected.toLocaleString()}</span>
              <span className="impact-label">Tons Collected</span>
            </div>
            <div className="impact-trend up"><i className="fas fa-arrow-up"></i> +12%</div>
          </div>
          <div className="impact-card">
            <div className="impact-icon co2"><i className="fas fa-cloud"></i></div>
            <div className="impact-data">
              <span className="impact-value">{animatedMetrics.co2Offset.toLocaleString()}</span>
              <span className="impact-label">CO2 Offset (kg)</span>
            </div>
            <div className="impact-trend up"><i className="fas fa-arrow-up"></i> +8%</div>
          </div>
          <div className="impact-card">
            <div className="impact-icon routes"><i className="fas fa-route"></i></div>
            <div className="impact-data">
              <span className="impact-value">{animatedMetrics.activeRoutes}</span>
              <span className="impact-label">Active Routes</span>
            </div>
            <div className="impact-trend neutral"><i className="fas fa-minus"></i> Live</div>
          </div>
          <div className="impact-card">
            <div className="impact-icon reports"><i className="fas fa-clipboard-check"></i></div>
            <div className="impact-data">
              <span className="impact-value">{animatedMetrics.reportsSubmitted}</span>
              <span className="impact-label">Community Reports</span>
            </div>
            <div className="impact-trend up"><i className="fas fa-arrow-up"></i> +24</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dash-main-grid">
        {/* Recent Activity */}
        <div className="dash-section dash-activity">
          <div className="section-header">
            <h3 className="section-title"><i className="fas fa-history"></i> Recent Activity</h3>
            <Link to="/user/status" className="section-link">View All <i className="fas fa-chevron-right"></i></Link>
          </div>
          <div className="activity-list">
            {myReports.slice(0, 5).map((report, index) => {
              const badge = getStatusBadge(report.status);
              return (
                <div key={report.id} className="activity-item" style={{ animationDelay: `${index * 0.08}s` }}>
                  <div className={`activity-icon-wrap ${report.status}`}>
                    <i className={`fas ${getReportIcon(report.type)}`}></i>
                  </div>
                  <div className="activity-content">
                    <h4>{report.title}</h4>
                    <div className="activity-meta">
                      <span><i className="fas fa-map-marker-alt"></i> {report.location || "N/A"}</span>
                      <span><i className="fas fa-clock"></i> {formatTimeAgo(report.created_at)}</span>
                    </div>
                  </div>
                  <span className={`activity-badge ${badge.class}`}>
                    <i className={`fas ${badge.icon}`}></i> {badge.label}
                  </span>
                </div>
              );
            })}
            {myReports.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>No reports yet. Start by reporting an issue!</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Widget */}
        <div className="dash-section dash-map">
          <div className="section-header">
            <h3 className="section-title"><i className="fas fa-map-marked-alt"></i> Nearby Bins</h3>
            <button className="location-btn" onClick={handleUseMyLocation} disabled={locationLoading}>
              {locationLoading ? (<><span className="btn-spinner"></span> Locating...</>) : (<><i className="fas fa-crosshairs"></i> Use My Location</>)}
            </button>
          </div>
          <div className="map-wrapper">
            <MapContainer center={userLocation || DANANG_CENTER} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {nearbyBins.map((bin) => (
                <Marker key={bin.id} position={[bin.lat, bin.lng]} icon={getMarkerIcon(bin.fill_level)}>
                  <Popup>
                    <div style={{ minWidth: 150, padding: 4 }}>
                      <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600 }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: bin.fill_level >= 80 ? "#EF4444" : bin.fill_level >= 50 ? "#F59E0B" : "#22C55E", marginRight: 6 }}></span>
                        {bin.bin_id}
                      </h4>
                      <p style={{ margin: "3px 0", fontSize: 12, color: "#64748b" }}><strong>Fill:</strong> {bin.fill_level}%</p>
                      <p style={{ margin: "3px 0", fontSize: 12, color: "#64748b" }}><strong>Type:</strong> {bin.bin_type}</p>
                      <p style={{ margin: "3px 0", fontSize: 12, color: "#64748b" }}><strong>Address:</strong> {bin.address}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {userLocation && (
                <Marker position={userLocation} icon={L.divIcon({ className: "user-location-marker", html: `<div style="background:#2563EB;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.3),0 3px 12px rgba(0,0,0,0.25);"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] })}>
                  <Popup>Your Location</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
          <div className="map-legend">
            <div className="legend-item"><span className="legend-dot" style={{ background: "#22C55E" }}></span><span>Normal (&lt;50%)</span></div>
            <div className="legend-item"><span className="legend-dot" style={{ background: "#F59E0B" }}></span><span>Warning (50-80%)</span></div>
            <div className="legend-item"><span className="legend-dot" style={{ background: "#EF4444" }}></span><span>Full (&gt;80%)</span></div>
            {userLocation && <div className="legend-item"><span className="legend-dot" style={{ background: "#2563EB", boxShadow: "0 0 0 2px rgba(37,99,235,0.3)" }}></span><span>Your Location</span></div>}
          </div>
        </div>
      </div>

      {/* Schedule Preview */}
      <div className="dash-section">
        <div className="section-header">
          <h3 className="section-title"><i className="fas fa-calendar-alt"></i> Upcoming Collection</h3>
          <Link to="/user/schedule" className="section-link">Full Schedule <i className="fas fa-chevron-right"></i></Link>
        </div>
        <div className="schedule-preview">
          {[
            { day: "Tomorrow", type: "General Waste", time: "7:00 AM", icon: "fa-trash-alt", color: "#22C55E" },
            { day: "Wed, Apr 2", type: "Recycling", time: "8:00 AM", icon: "fa-recycle", color: "#2563EB" },
            { day: "Fri, Apr 4", type: "Organic Waste", time: "7:30 AM", icon: "fa-seedling", color: "#F59E0B" },
          ].map((item, i) => (
            <div key={i} className="schedule-item">
              <div className="schedule-icon" style={{ background: `${item.color}18`, color: item.color }}><i className={`fas ${item.icon}`}></i></div>
              <div className="schedule-info"><h4>{item.type}</h4><p>{item.day} at {item.time}</p></div>
              <span className="schedule-day">{item.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="dash-footer">
        <div className="footer-content">
          <div className="footer-brand"><i className="fas fa-leaf"></i><span>AI Waste Optimizer</span></div>
          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/user/feedback">Feedback</Link>
            <Link to="/user/profile">Profile</Link>
          </div>
          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noreferrer"><i className="fab fa-facebook-f"></i></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer"><i className="fab fa-twitter"></i></a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>2026 AI Waste Optimizer - Smart City Waste Management. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default CitizenDashboard;
