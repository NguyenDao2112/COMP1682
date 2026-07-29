import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { routesAPI, vehiclesAPI, binsAPI } from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { AreaChart, Area, RadialBarChart, RadialBar, ResponsiveContainer, Cell } from "recharts";
import { setupLeafletIcons, DANANG_CENTER, createFleetIcon } from "../../components/maps/mapUtils";
import "./Manager.css";

// Ensure Leaflet icons are setup
setupLeafletIcons();

function ManagerDashboard() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  // --- STATE ---
  const [stats, setStats] = useState({
    successRate: 98.2,
    successTrend: 1.2,
    delayTime: 14,
    delayTrend: -4.3,
    activeDrivers: 142,
    idleDrivers: 12
  });
  
  const [drivers, setDrivers] = useState([]);
  const [bins, setBins] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await routesAPI.getAll();
        if (data && data.length > 0) {
          const mappedDrivers = data.map((route, i) => {
            // Dynamically assign base coordinates based on route name to match real bin clusters
            let baseCoords = [16.0600, 108.2100]; // Default fallback
            let districtName = "Unknown";
            
            if (route.path && route.path.length > 0) {
                baseCoords = route.path[0];
                districtName = route.route_name.split(" ")[0];
            } else if (route.route_name && route.route_name.toLowerCase().includes("hai chau")) {
                baseCoords = [16.0550, 108.2020]; // Center of Hai Chau bin cluster
                districtName = "Hai Chau";
            } else if (route.route_name && route.route_name.toLowerCase().includes("son tra")) {
                baseCoords = [16.0850, 108.2320]; // Center of Son Tra bin cluster
                districtName = "Son Tra";
            } else if (route.route_name && route.route_name.toLowerCase().includes("lien chieu")) {
                baseCoords = [16.0650, 108.1500]; // Center of Lien Chieu bin cluster
                districtName = "Lien Chieu";
            }
            
            // Adjust coordinates based on status to simulate progress
            let finalCoords = [...baseCoords];
            if (route.status === "in_progress") {
                // Move it slightly near the bins
                finalCoords[0] += 0.001;
                finalCoords[1] += 0.001;
            } else if (route.status === "completed") {
                // Move it to a fake 'depot' endpoint slightly away from bins
                finalCoords[0] -= 0.005;
                finalCoords[1] -= 0.005;
            }
            
            return {
              id: route.vehicle_id || `DX-100${i}`,
              route_id: route.id,
              name: route.driver_name || "Unassigned",
              status: route.status === "in_progress" ? "transit" : route.status === "completed" ? "completed" : "depot",
              loc: route.route_name || `${districtName} Route`,
              time: route.scheduled_date || "Today",
              warning: "none",
              warningText: "None Detected",
              coords: finalCoords,
              avatar: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${30 + i}.jpg`
            };
          });

          // Simulate some operational issues relevant to waste management
          if (mappedDrivers.length > 0) {
            mappedDrivers[0].warning = "danger";
            mappedDrivers[0].warningText = "Missed Collection";
          }
          // Removed hardcoded overrides for Tran Van B to allow real API status to flow through

          const actualDrivers = mappedDrivers.filter(d => d.name !== "Unassigned");
          
          setDrivers(actualDrivers);
          setStats(prev => ({
            ...prev,
            activeDrivers: actualDrivers.filter(d => d.status === 'transit').length,
            idleDrivers: actualDrivers.filter(d => d.status !== 'transit').length
          }));
        }
      } catch (error) {
        console.error("Failed to fetch routes for dashboard:", error);
      }
      
      try {
        const binData = await binsAPI.getForMap();
        setBins(binData);
      } catch (error) {
        console.error("Failed to fetch bins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Setup polling for Real-time IoT updates
    const intervalId = setInterval(async () => {
      try {
        const binData = await binsAPI.getForMap();
        setBins(binData);
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  const [alerts, setAlerts] = useState([
    { id: 1, title: "Traffic Congestion Detected", desc: "Route RT-002 (Son Tra District Route - Driver B) is facing heavy traffic. AI rerouting suggested.", type: "warning", tag: "REROUTE", time: "Just now", targetDriver: "DX-1002" },
    { id: 2, title: "Bin Overflow Prevented", desc: "Predictive model successfully prioritized Bin BIN-HC-005 in Hai Chau District before overflow.", type: "success", tag: "PREDICTED", time: "15m ago" },
    { id: 3, title: "Vehicle Maintenance Due", desc: "Truck DX-1003 (Lien Chieu Route) engine efficiency dropped by 4%. Schedule checkup.", type: "warning", tag: "MAINTENANCE", time: "2h ago", targetDriver: "DX-1003" }
  ]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Driver Modal State
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Toasts State
  const [toasts, setToasts] = useState([]);

  // --- LOGIC ---
  const mapUrl = darkMode 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"; // Google Maps standard layer

  // Filter Drivers
  const filteredDrivers = drivers.filter(driver => {
    if (driver.name === "Unassigned") return false;
    
    const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          driver.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          driver.loc.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "In Transit") return matchesSearch && driver.status === "transit";
    if (activeTab === "At Depot") return matchesSearch && driver.status === "depot";
    return matchesSearch;
  });

  // Toast Function
  const showToast = (title, desc, type = "info") => {
    const newToast = { id: Date.now(), title, desc, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Button Handlers
  const handleDispatchAlert = (driver) => {
    showToast(
      "Alert Dispatched",
      `Urgent notification sent to ${driver.name} (Vehicle ${driver.id}).`,
      "success"
    );
  };

  const handleReviewSuggestion = (alertId, driverId) => {
    // Remove the alert from the AI Insights panel
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    
    showToast(
      "AI Suggestion Approved",
      `Rerouting applied for ${driverId}. The fleet map will update shortly.`,
      "success"
    );
  };

  const handleTopIconClick = (type) => {
    if (type === "bell") {
      showToast("No New Notifications", "You are completely caught up.", "info");
    } else if (type === "help") {
      navigate('/manager/about');
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = (currentUser.full_name && currentUser.full_name !== "Manager") 
    ? currentUser.full_name 
    : "Dispatcher Duy (Tran Quoc Duy)";
  const userEmail = (currentUser.email && !currentUser.email.includes("aiwaste.com")) 
    ? currentUser.email 
    : "dispatcher.duy@wasteoptimizer.com";

  return (
    <div className={`manager-dashboard ${darkMode ? "dark" : ""}`}>
      
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="custom-toast">
            <div className={`toast-icon ${toast.type}`}>
              {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
              {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
              {toast.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
            </div>
            <div className="toast-content">
              <h4 className="toast-title">{toast.title}</h4>
              <p className="toast-desc">{toast.desc}</p>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
      </div>

      {/* Top Header */}
      <header className="dashboard-top-bar">
        <h1 className="page-title">Delivery Dashboard</h1>
        <div className="top-actions">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search fleet, drivers, or routes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="action-icons">
            <button className="icon-btn" onClick={() => handleTopIconClick('bell')}><i className="far fa-bell"></i></button>
            <button className="icon-btn" onClick={() => handleTopIconClick('help')}><i className="far fa-question-circle"></i></button>
            <div className="profile-menu-container">
              <button className="icon-btn" style={{backgroundColor: "var(--dash-brand-danger-light)", color: "var(--dash-brand-danger) !important", border: "none"}} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <i className="fas fa-user-circle"></i>
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <h4>{userName}</h4>
                    <p>{userEmail}</p>
                  </div>
                  <button className="profile-dropdown-btn" onClick={() => navigate("/manager/settings")}>
                    <i className="fas fa-cog"></i> Settings
                  </button>
                  <button className="profile-dropdown-btn logout" onClick={() => navigate("/auth/login")}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="bento-grid">
        
        {/* Left: Map Panel */}
        <div className="bento-map glass-panel">
          <div className="map-overlay-card" style={{backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.8)'}}>
            <h4 className="overlay-title" style={{color: 'var(--dash-text-primary)'}}>FLEET VISIBILITY</h4>
            <div className="overlay-stats">
              <div className="overlay-stat" style={{color: 'var(--dash-text-secondary)'}}>
                <span className="dot active"></span>
                Active ({stats.activeDrivers})
              </div>
              <div className="overlay-stat" style={{color: 'var(--dash-text-secondary)'}}>
                <span className="dot idle"></span>
                Completed ({stats.idleDrivers})
              </div>
            </div>
          </div>
          
          <MapContainer 
            center={DANANG_CENTER} 
            zoom={12} 
            style={{ width: "100%", height: "100%", zIndex: 1, background: 'transparent' }}
            zoomControl={false}
          >
            <TileLayer url={mapUrl} />
            {drivers.map(d => (
              <Marker 
                key={d.id} 
                position={d.coords} 
                icon={createFleetIcon(d.status === "transit" ? "vehicle" : d.status === "depot" ? "vehicleIdle" : "vehicleCompleted")} 
              >
                <Popup className="glass-popup">
                  <div style={{textAlign: "center"}}>
                    <h4 style={{margin: "0 0 5px 0", color: "#333"}}>{d.name}</h4>
                    <p style={{margin: "0 0 5px 0", fontSize: "12px", color: "#666"}}>{d.id}</p>
                    <span className={`status-pill ${d.status === "transit" ? "active" : "warning"}`} style={{fontSize: "11px", padding: "2px 8px"}}>
                      {d.status === "transit" ? "In Transit" : "At Depot"}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* IoT Bins Markers */}
            {bins.map(b => {
              // Determine color based on fill level and temperature
              let color = "#10B981"; // Emerald
              let glow = "";
              if (b.temperature > 60) {
                 color = "#EF4444"; // Red
                 glow = "box-shadow: 0 0 15px #EF4444;";
              } else if (b.fill_level > 80) {
                 color = "#F59E0B"; // Amber
                 glow = "box-shadow: 0 0 10px #F59E0B;";
              }
              
              const binHtml = `
                <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; ${glow} transition: all 0.3s ease;">
                  <i class="fas fa-trash" style="color: white; font-size: 10px;"></i>
                </div>
              `;
              const customIcon = window.L ? window.L.divIcon({
                html: binHtml,
                className: "",
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              }) : null;
              
              return customIcon ? (
                <Marker 
                  key={`bin-${b.id}`} 
                  position={[b.lat, b.lng]} 
                  icon={customIcon} 
                >
                  <Popup>
                    <div style={{minWidth: "130px", padding: "4px"}}>
                      <h4 style={{margin: "0 0 8px 0", color: "#111", borderBottom: "1px solid #eee", paddingBottom: "4px"}}>{b.bin_id}</h4>
                      <div style={{display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px"}}>
                        <span style={{color: "#555"}}>Fill Level:</span>
                        <span style={{fontWeight: "600", color: b.fill_level > 80 ? "#F59E0B" : "#10B981"}}>{b.fill_level}%</span>
                      </div>
                      <div style={{display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px"}}>
                        <span style={{color: "#555"}}>Temp:</span>
                        <span style={{fontWeight: "600", color: b.temperature > 60 ? "#EF4444" : "#333"}}>{b.temperature}°C</span>
                      </div>
                      <div style={{display: "flex", justifyContent: "space-between", fontSize: "13px"}}>
                        <span style={{color: "#555"}}>Battery:</span>
                        <span style={{fontWeight: "600", color: b.battery_level < 20 ? "#EF4444" : "#10B981"}}>{b.battery_level}%</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ) : null;
            })}
          </MapContainer>
        </div>

        {/* AI Alerts Panel */}
        <div className="bento-alerts glass-panel" style={{padding: '24px', display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h3 style={{margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <i className="fas fa-bolt" style={{color: 'var(--dash-brand-warning)'}}></i> AI Insights
            </h3>
            <span style={{fontSize: '12px', background: 'var(--dash-brand-danger-light)', color: 'var(--dash-brand-danger)', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold'}}>
              {alerts.length} Active
            </span>
          </div>
          
          <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px'}}>
            {alerts.length > 0 ? alerts.map(alert => (
              <div key={alert.id} style={{
                background: 'rgba(0,0,0,0.02)', border: '1px solid var(--dash-border-color)', 
                padding: '16px', borderRadius: '12px', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: alert.type === 'warning' ? 'var(--dash-brand-warning)' : 'var(--dash-brand-success)'}}></div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span style={{fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', color: alert.type === 'warning' ? 'var(--dash-brand-warning)' : 'var(--dash-brand-success)'}}>{alert.tag}</span>
                  <span style={{fontSize: '11px', color: 'var(--dash-text-muted)'}}>{alert.time}</span>
                </div>
                <h4 style={{margin: '0 0 6px 0', fontSize: '14px', color: 'var(--dash-text-primary)'}}>{alert.title}</h4>
                <p style={{margin: '0 0 12px 0', fontSize: '13px', color: 'var(--dash-text-secondary)', lineHeight: '1.4'}}>{alert.desc}</p>
                {alert.targetDriver && (
                  <button onClick={() => handleReviewSuggestion(alert.id, alert.targetDriver)} style={{
                    background: 'var(--dash-brand-primary)', color: '#fff', border: 'none', 
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                  }}>
                    Review Suggestion
                  </button>
                )}
              </div>
            )) : (
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--dash-text-muted)'}}>
                <i className="fas fa-check-circle" style={{fontSize: '32px', marginBottom: '12px', color: 'var(--dash-brand-success)'}}></i>
                <p>System operating optimally.</p>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="bento-kpi-1 glass-panel" style={{padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <h4 style={{margin: 0, fontSize: '13px', color: 'var(--dash-text-secondary)', fontWeight: '600'}}>SUCCESS RATE</h4>
          <div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px'}}>
              <h2 style={{margin: 0, fontSize: '36px', fontWeight: '800', letterSpacing: '-1px'}}>{stats.successRate}%</h2>
              <span style={{color: 'var(--dash-brand-success)', fontSize: '14px', fontWeight: '600'}}><i className="fas fa-arrow-up"></i> {stats.successTrend}%</span>
            </div>
            <div style={{height: '4px', width: '100%', background: 'var(--dash-brand-success-light)', borderRadius: '2px', overflow: 'hidden'}}>
              <div style={{width: `${stats.successRate}%`, height: '100%', background: 'var(--dash-brand-success)', borderRadius: '2px'}}></div>
            </div>
          </div>
        </div>

        <div className="bento-kpi-2 glass-panel" style={{padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
          <h4 style={{margin: 0, fontSize: '13px', color: 'var(--dash-text-secondary)', fontWeight: '600'}}>AVG DELAY</h4>
          <div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px'}}>
              <h2 style={{margin: 0, fontSize: '36px', fontWeight: '800', letterSpacing: '-1px'}}>{stats.delayTime}m</h2>
              <span style={{color: 'var(--dash-brand-success)', fontSize: '14px', fontWeight: '600'}}><i className="fas fa-arrow-down"></i> {Math.abs(stats.delayTrend)}%</span>
            </div>
            <div style={{height: '4px', width: '100%', background: 'var(--dash-brand-danger-light)', borderRadius: '2px', overflow: 'hidden'}}>
              <div style={{width: '20%', height: '100%', background: 'var(--dash-brand-danger)', borderRadius: '2px'}}></div>
            </div>
          </div>
        </div>

        <div className="bento-kpi-3 glass-panel" style={{padding: '24px', display: 'flex', alignItems: 'center'}}>
          <div style={{flex: 1}}>
            <h4 style={{margin: '0 0 16px 0', fontSize: '13px', color: 'var(--dash-text-secondary)', fontWeight: '600'}}>FLEET EFFICIENCY (AI)</h4>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <span style={{fontSize: '14px', fontWeight: '500'}}>Fuel Saved</span>
              <span style={{fontWeight: '700', color: 'var(--dash-brand-success)'}}>214 L</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span style={{fontSize: '14px', fontWeight: '500'}}>Time Optimized</span>
              <span style={{fontWeight: '700', color: 'var(--dash-brand-primary)'}}>18 hrs</span>
            </div>
          </div>
          <div style={{width: '120px', height: '100px'}}>
             <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={8} data={[{name: 'Eff', uv: 88, fill: 'var(--dash-brand-primary)'}]}>
                 <RadialBar minAngle={15} background clockWise dataKey="uv" cornerRadius={10} />
                 <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{fontSize: '18px', fontWeight: '800', fill: 'var(--dash-text-primary)'}}>88%</text>
               </RadialBarChart>
             </ResponsiveContainer>
          </div>
        </div>

      {/* Bottom Row: Table */}
      <div className="bento-table glass-panel" style={{padding: '0'}}>
        <div className="table-header-row">
          <h3 className="table-title">Active Drivers</h3>
          <div className="table-filters">
            <div className="tab-group">
              {["All", "In Transit", "At Depot"].map(tab => (
                <button 
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "All" ? "All Drivers" : tab}
                </button>
              ))}
            </div>
            <button className="filter-btn" onClick={() => showToast("Filters", "Advanced filtering panel would open here.", "info")}>
              <i className="fas fa-filter"></i> Filter
            </button>
          </div>
        </div>

        <table className="saas-table">
          <thead>
            <tr>
              <th>DRIVER NAME</th>
              <th>CURRENT ROUTE STATUS</th>
              <th>OPERATIONAL ISSUES</th>
              <th style={{textAlign: "right"}}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.length > 0 ? (
              filteredDrivers.map(driver => (
                <tr key={driver.id} className="clickable-row" onClick={() => { setSelectedDriver(driver); setShowDriverModal(true); }}>
                  <td className="driver-cell">
                    <div className="avatar" style={{ backgroundImage: `url(${driver.avatar})` }}></div>
                    <div className="driver-info">
                      <h5>{driver.name}</h5>
                      <p>ID: #{driver.id}</p>
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      <span className={`status-dot ${driver.status}`}></span>
                      {driver.status === "transit" ? "In Transit" : driver.status === "depot" ? "At Depot" : "Completed"}
                      <span className="status-meta">{driver.loc} ({driver.time})</span>
                    </div>
                  </td>
                  <td>
                    <span className={`warning-pill ${driver.warning}`}>
                      {driver.warning === "danger" && <i className="fas fa-exclamation-triangle" style={{marginRight: '4px'}}></i>}
                      {driver.warning === "warning" && <i className="fas fa-exclamation-circle" style={{marginRight: '4px'}}></i>}
                      {driver.warningText}
                    </span>
                  </td>
                  <td style={{textAlign: "right"}}>
                    <button className="dispatch-btn" onClick={() => handleDispatchAlert(driver)}>DISPATCH ALERT</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="empty-state">
                  No drivers found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* End of Bento Grid */}
      </div>

      {/* Driver Details Modal */}
      {showDriverModal && selectedDriver && (
        <div className="modal-overlay" onClick={() => setShowDriverModal(false)}>
          <div className="modal-content glass-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Driver Details</h3>
              <button className="close-btn" onClick={() => setShowDriverModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
                <div className="avatar" style={{ backgroundImage: `url(${selectedDriver.avatar})`, width: '64px', height: '64px' }}></div>
                <div>
                  <h2 style={{margin: '0 0 4px 0'}}>{selectedDriver.name}</h2>
                  <p style={{margin: 0, color: 'var(--dash-text-secondary)'}}>ID: #{selectedDriver.id} • Vehicle: {selectedDriver.truck}</p>
                </div>
              </div>
              
              <div className="form-group">
                <label>Current Status</label>
                <select 
                  className="dispatch-select" 
                  value={selectedDriver.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    const dbStatus = newStatus === "transit" ? "in_progress" : newStatus === "completed" ? "completed" : "pending";
                    
                    try {
                      if (selectedDriver.route_id) {
                        await routesAPI.update(selectedDriver.route_id, { status: dbStatus });
                      } else {
                        showToast("System Warning", "Please press F5 to refresh the data structure.", "warning");
                        return;
                      }
                      
                      // Optimistic UI Update
                      setDrivers(prev => prev.map(d => d.id === selectedDriver.id ? {...d, status: newStatus} : d));
                      setSelectedDriver({...selectedDriver, status: newStatus});
                      showToast("Status Updated", `Driver ${selectedDriver.name} is now ${newStatus.replace('_', ' ')}.`, "success");
                    } catch (error) {
                      console.error("Error updating status:", error);
                      showToast("Update Failed", "Could not update status on server.", "error");
                    }
                  }}
                >
                  <option value="transit">In Transit</option>
                  <option value="depot">At Depot</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="modal-actions" style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                <button className="btn-dispatch-large" style={{flex: 1}} onClick={() => showToast("Message Sent", `Pinged ${selectedDriver.name}.`, "success")}>
                  <i className="fas fa-comment"></i> Message Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ManagerDashboard;
