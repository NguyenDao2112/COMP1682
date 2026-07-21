import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { routesAPI } from "../../services/api";
import "./Manager.css";

function Fleet() {
  const { darkMode } = useTheme();
  
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const routes = await routesAPI.getAll();
        if (routes && routes.length > 0) {
          const mappedFleet = routes.map((r, index) => ({
            id: r.vehicle_id || `TRK-${index + 100}`,
            driver: r.driver_name || "Unassigned",
            type: "Compactor",
            status: r.status === "in_progress" ? "Active" : r.status === "completed" ? "Completed" : "Active",
            maintenance: "Good",
            route: r.route_name || "Unassigned Route",
          }));
          setFleet(mappedFleet);
        }
      } catch (error) {
        console.error("Failed to fetch fleet data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFleetData();
  }, []);

  const handleRequestProvision = async () => {
    try {
      const { API_URL } = await import("../../services/config");
      await fetch(`${API_URL}/api/fleet/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PROVISION_REQUEST",
          message: "Manager requests provisioning of new Driver (Le Van C) and Vehicle (TRUCK_003).",
          status: "warning"
        })
      });
      alert("Provision request sent to Admin for approval.");
    } catch (e) {
      alert("Failed to send request.");
    }
  };

  return (
    <div className={`manager-dashboard ${darkMode ? "dark" : ""}`} style={{minHeight: "100vh"}}>
      
      {/* Top Header */}
      <header className="dashboard-top-bar" style={{marginBottom: "24px"}}>
        <div>
          <h1 className="page-title">Fleet Management</h1>
          <p style={{color: "var(--dash-text-muted)", margin: "4px 0 0 0", fontSize: "14px"}}>Manage drivers, vehicles, and maintenance schedules</p>
        </div>
        <div className="top-actions">
          <button 
            onClick={handleRequestProvision}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", borderRadius: "8px", border: "none",
              background: "var(--dash-brand-primary)",
              color: "#fff", fontWeight: "600", cursor: "pointer",
              boxShadow: "0 4px 14px 0 rgba(59, 130, 246, 0.39)",
              transition: "transform 0.2s"
          }}>
            <i className="fas fa-paper-plane"></i> Request New Vehicle
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="bento-grid" style={{marginBottom: "24px"}}>
        <div className="glass-panel" style={{gridColumn: "span 4", padding: "24px", display: "flex", alignItems: "center", gap: "16px"}}>
          <div style={{width: "48px", height: "48px", borderRadius: "12px", background: "var(--dash-brand-success-light)", color: "var(--dash-brand-success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"}}>
            <i className="fas fa-truck"></i>
          </div>
          <div>
            <h4 style={{margin: "0 0 4px 0", color: "var(--dash-text-secondary)", fontSize: "13px"}}>TOTAL FLEET</h4>
            <h2 style={{margin: 0, fontSize: "24px", color: "var(--dash-text-primary)"}}>{fleet.length} <span style={{fontSize: "14px", color: "var(--dash-text-muted)"}}>Vehicles</span></h2>
          </div>
        </div>

        <div className="glass-panel" style={{gridColumn: "span 4", padding: "24px", display: "flex", alignItems: "center", gap: "16px"}}>
          <div style={{width: "48px", height: "48px", borderRadius: "12px", background: "var(--dash-brand-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"}}>
            <i className="fas fa-user-tie"></i>
          </div>
          <div>
            <h4 style={{margin: "0 0 4px 0", color: "var(--dash-text-secondary)", fontSize: "13px", opacity: 0.8}}>AVAILABLE DRIVERS</h4>
            <h2 style={{margin: 0, fontSize: "24px", color: "var(--dash-text-primary)"}}>{fleet.filter(f => f.status === 'Active').length} <span style={{fontSize: "14px", color: "var(--dash-text-muted)"}}>On Duty</span></h2>
          </div>
        </div>

        <div className="glass-panel" style={{gridColumn: "span 4", padding: "24px", display: "flex", alignItems: "center", gap: "16px"}}>
          <div style={{width: "48px", height: "48px", borderRadius: "12px", background: "var(--dash-brand-danger-light)", color: "var(--dash-brand-danger)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"}}>
            <i className="fas fa-tools"></i>
          </div>
          <div>
            <h4 style={{margin: "0 0 4px 0", color: "var(--dash-text-secondary)", fontSize: "13px"}}>IN MAINTENANCE</h4>
            <h2 style={{margin: 0, fontSize: "24px", color: "var(--dash-text-primary)"}}>0 <span style={{fontSize: "14px", color: "var(--dash-text-muted)"}}>Vehicles</span></h2>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bento-grid">
        <div className="glass-panel bento-table" style={{gridColumn: "span 12", padding: "0"}}>
          <div style={{padding: "20px 24px", borderBottom: "1px solid var(--dash-border-color)", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <h3 style={{margin: 0, fontSize: "18px", color: "var(--dash-text-primary)"}}>Vehicle Roster</h3>
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Search by ID or Driver..." />
            </div>
          </div>
          
          <table className="saas-table" style={{width: "100%", borderCollapse: "collapse"}}>
            <thead>
              <tr style={{background: "rgba(0,0,0,0.02)", textAlign: "left"}}>
                <th style={{padding: "16px 24px", fontSize: "12px", color: "var(--dash-text-muted)"}}>VEHICLE ID</th>
                <th style={{padding: "16px 24px", fontSize: "12px", color: "var(--dash-text-muted)"}}>DRIVER</th>
                <th style={{padding: "16px 24px", fontSize: "12px", color: "var(--dash-text-muted)"}}>TYPE</th>
                <th style={{padding: "16px 24px", fontSize: "12px", color: "var(--dash-text-muted)"}}>STATUS</th>
                <th style={{padding: "16px 24px", fontSize: "12px", color: "var(--dash-text-muted)"}}>MAINTENANCE</th>
                <th style={{padding: "16px 24px", fontSize: "12px", color: "var(--dash-text-muted)"}}>ACTIVE ROUTE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Loading real-time fleet data...</td></tr>
              ) : fleet.length > 0 ? (
                fleet.map(vehicle => (
                  <tr key={vehicle.id} style={{borderBottom: "1px solid var(--dash-border-color)", transition: "background 0.2s"}} className="fleet-row">
                    <td style={{padding: "16px 24px", fontWeight: "600", color: "var(--dash-text-primary)"}}>{vehicle.id}</td>
                    <td style={{padding: "16px 24px"}}>
                      <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                        <div style={{width: "32px", height: "32px", borderRadius: "50%", background: "var(--dash-brand-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold"}}>
                          {vehicle.driver.charAt(0)}
                        </div>
                        <span style={{color: "var(--dash-text-primary)", fontWeight: "500"}}>{vehicle.driver}</span>
                      </div>
                    </td>
                    <td style={{padding: "16px 24px", color: "var(--dash-text-secondary)"}}>{vehicle.type}</td>
                    <td style={{padding: "16px 24px"}}>
                      <span style={{
                        padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                        background: vehicle.status === "Active" ? "var(--dash-brand-success-light)" : vehicle.status === "Completed" ? "rgba(148, 163, 184, 0.2)" : "var(--dash-brand-danger-light)",
                        color: vehicle.status === "Active" ? "var(--dash-brand-success)" : vehicle.status === "Completed" ? "var(--dash-text-secondary)" : "var(--dash-brand-danger)"
                      }}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td style={{padding: "16px 24px"}}>
                      <span style={{color: vehicle.maintenance.includes("Due") || vehicle.maintenance.includes("Check") ? "var(--dash-brand-warning)" : "var(--dash-brand-success)", fontWeight: "500"}}>
                        {vehicle.maintenance.includes("Good") ? <i className="fas fa-check-circle"></i> : <i className="fas fa-exclamation-triangle"></i>} {vehicle.maintenance}
                      </span>
                    </td>
                    <td style={{padding: "16px 24px", color: "var(--dash-text-secondary)"}}>{vehicle.route}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No active drivers assigned to routes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Fleet;
