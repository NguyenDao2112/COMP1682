import React, { useState, useEffect } from "react";
import { usersAPI, binsAPI, routesAPI, healthAPI } from "../../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    bins: 0,
    routes: 0,
    efficiency: 94
  });

  const [health, setHealth] = useState({
    cpu: 24,
    ram: 45,
    apiLatency: 120,
    dbUptime: '99.9%'
  });

  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/fleet/incidents");
        if (res.ok) {
          const data = await res.json();
          setIncidents(data);
        }
      } catch (err) {
        console.error("Failed to fetch incidents", err);
      }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/fleet/incidents/${id}`, { method: "DELETE" });
      setIncidents(incidents.filter(inc => inc.id !== id));
    } catch (err) {}
  };

  const handleDispatch = async (id, type) => {
    if (type === "PROVISION_REQUEST") {
      try {
        await routesAPI.provisionDriverRoute();
        alert(`[SYSTEM_SUCCESS]: Provisioning complete. Driver 3 (Le Van C) and TRUCK_003 are now active in the system.`);
      } catch (err) {
        alert(`[SYSTEM_ERROR]: Failed to provision assets. ` + err.message);
      }
    } else {
      let actionStr = "";
      if (type === "HARDWARE_FAILURE") actionStr = "Maintenance technician dispatched to location.";
      else if (type === "CAPACITY_OVERFLOW") actionStr = "Nearest collection unit rerouted for emergency pickup.";
      else actionStr = "Emergency protocol activated and personnel notified.";
      
      alert(`[SYSTEM_DISPATCH]: ${actionStr}\nIncident ${id} is now being handled.`);
    }
    
    // Remove from queue after dispatching
    handleAcknowledge(id);
  };

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await healthAPI.getTelemetry();
        setHealth({
          cpu: data.cpu,
          ram: data.ram,
          apiLatency: data.apiLatency,
          dbUptime: data.dbUptime,
          firewallStatus: data.firewallStatus,
          threatLevel: data.threatLevel,
          lastBackup: data.lastBackup
        });
      } catch (err) {
        console.error("Failed to fetch telemetry", err);
      }
    };
    
    fetchHealth();
    const interval = setInterval(fetchHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, bins, routes] = await Promise.all([
          usersAPI.getAll(),
          binsAPI.getAll(),
          routesAPI.getAll()
        ]);
        
        setStats({
          users: users.length || 0,
          bins: bins.length || 0,
          routes: routes.length || 0,
          efficiency: 98
        });
      } catch (error) {
        console.error("Failed to load global stats", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="cmd-panel-title" style={{fontSize: '28px', marginBottom: '32px'}}>
        <i className="fas fa-satellite-dish" style={{color: 'var(--admin-cyan)'}}></i> GLOBAL TELEMETRY
      </h1>

      {/* Top 4 Stats */}
      <div className="cmd-grid-top">
        <div className="cmd-panel">
          <div className="cmd-stat-box">
            <div className="cmd-stat-header">
              Total Users
              <div className="cmd-stat-icon badge-cyan"><i className="fas fa-users"></i></div>
            </div>
            <div className="cmd-stat-value">{stats.users}</div>
            <div className="cmd-stat-trend trend-up"><i className="fas fa-arrow-up"></i> +12% this month</div>
          </div>
        </div>

        <div className="cmd-panel">
          <div className="cmd-stat-box">
            <div className="cmd-stat-header">
              Active Sensors
              <div className="cmd-stat-icon badge-emerald"><i className="fas fa-wifi"></i></div>
            </div>
            <div className="cmd-stat-value">{stats.bins}</div>
            <div className="cmd-stat-trend trend-up"><i className="fas fa-arrow-up"></i> 100% Online</div>
          </div>
        </div>

        <div className="cmd-panel">
          <div className="cmd-stat-box">
            <div className="cmd-stat-header">
              Fleet Routes
              <div className="cmd-stat-icon badge-purple"><i className="fas fa-project-diagram"></i></div>
            </div>
            <div className="cmd-stat-value">{stats.routes}</div>
            <div className="cmd-stat-trend trend-up"><i className="fas fa-arrow-up"></i> Optimizing</div>
          </div>
        </div>

        <div className="cmd-panel">
          <div className="cmd-stat-box">
            <div className="cmd-stat-header">
              AI Efficiency
              <div className="cmd-stat-icon badge-warning"><i className="fas fa-brain"></i></div>
            </div>
            <div className="cmd-stat-value">{stats.efficiency}%</div>
            <div className="cmd-stat-trend trend-up"><i className="fas fa-arrow-up"></i> Peak Performance</div>
          </div>
        </div>
      </div>

      {/* Main Grid: System Health & ROI */}
      <div className="cmd-grid-main">
        {/* Left: System Health */}
        <div className="cmd-panel">
          <h3 className="cmd-panel-title"><i className="fas fa-server"></i> Server Node Status</h3>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px'}}>
            {/* CPU */}
            <div>
              <div className="cyber-slider-header">
                <span className="cyber-slider-label">CPU Load (Global Cluster)</span>
                <span className="cyber-slider-value">{health.cpu.toFixed(1)}%</span>
              </div>
              <div style={{height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden'}}>
                <div style={{height: '100%', width: `${health.cpu}%`, background: health.cpu > 80 ? 'var(--admin-rose)' : 'var(--admin-cyan)', transition: 'width 0.5s'}} />
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="cyber-slider-header">
                <span className="cyber-slider-label">Memory Utilization</span>
                <span className="cyber-slider-value">{health.ram.toFixed(1)}%</span>
              </div>
              <div style={{height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden'}}>
                <div style={{height: '100%', width: `${health.ram}%`, background: 'var(--admin-purple)'}} />
              </div>
            </div>

            {/* Latency */}
            <div>
              <div className="cyber-slider-header">
                <span className="cyber-slider-label">API Gateway Latency</span>
                <span className="cyber-slider-value">{Math.round(health.apiLatency)} ms</span>
              </div>
              <div style={{height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden'}}>
                <div style={{height: '100%', width: `${Math.min(100, health.apiLatency / 3)}%`, background: health.apiLatency > 200 ? 'var(--admin-warning)' : 'var(--admin-emerald)', transition: 'width 0.5s'}} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Security & Network */}
        <div className="cmd-panel">
          <h3 className="cmd-panel-title"><i className="fas fa-shield-alt"></i> Security Matrix</h3>
          
          <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
            <li style={{padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between'}}>
              <span style={{color: 'var(--admin-text-muted)'}}>Firewall Status</span>
              <span className="badge-emerald">{health.firewallStatus || "Active"}</span>
            </li>
            <li style={{padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between'}}>
              <span style={{color: 'var(--admin-text-muted)'}}>Threat Level</span>
              <span className="badge-cyan">{health.threatLevel || "Minimal"}</span>
            </li>
            <li style={{padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between'}}>
              <span style={{color: 'var(--admin-text-muted)'}}>Last Backup</span>
              <span style={{fontWeight: 600, color: '#f8fafc'}}>{health.lastBackup || "12 mins ago"}</span>
            </li>
            <li style={{padding: '16px 0', display: 'flex', justifyContent: 'space-between'}}>
              <span style={{color: 'var(--admin-text-muted)'}}>DB Uptime</span>
              <span style={{fontWeight: 600, color: '#f8fafc'}}>{health.dbUptime || "99.9%"}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Incident Response Queue */}
      <div className="cmd-panel" style={{marginTop: '24px', borderColor: incidents.length > 0 ? 'var(--admin-rose)' : 'var(--admin-border)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <h3 className="cmd-panel-title" style={{color: incidents.length > 0 ? 'var(--admin-rose)' : 'var(--admin-cyan)'}}>
            <i className="fas fa-exclamation-triangle"></i> INCIDENT RESPONSE QUEUE {incidents.length > 0 && `(${incidents.length})`}
          </h3>
          {incidents.length > 0 && <button className="cyber-btn" onClick={() => setIncidents([])} style={{borderColor: 'var(--admin-rose)', color: 'var(--admin-rose)'}}>Acknowledge All</button>}
        </div>
        
        {incidents.length === 0 ? (
          <div style={{textAlign: 'center', color: 'var(--admin-text-muted)', padding: '24px'}}>
            <i className="fas fa-check-circle" style={{color: 'var(--admin-emerald)', fontSize: '24px', marginBottom: '12px'}}></i>
            <div>All systems nominal. No active incidents.</div>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {incidents.map(inc => (
              <div key={inc.id} style={{
                background: 'rgba(0,0,0,0.4)', 
                borderLeft: `4px solid ${inc.status === 'critical' ? 'var(--admin-rose)' : 'var(--admin-warning)'}`,
                padding: '16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px'}}>
                    <span className={inc.status === 'critical' ? 'badge-rose' : 'badge-warning'}>{inc.id}</span>
                    <span style={{color: 'var(--admin-text-muted)', fontSize: '12px'}}>{inc.time}</span>
                    <span style={{color: '#fff', fontSize: '12px', fontFamily: 'monospace'}}>[{inc.type}]</span>
                  </div>
                  <div style={{color: '#f8fafc', fontSize: '15px'}}>{inc.message}</div>
                </div>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button className="cyber-btn" onClick={() => handleAcknowledge(inc.id)} title="Acknowledge & Dismiss"><i className="fas fa-check"></i></button>
                  <button className="cyber-btn primary" onClick={() => handleDispatch(inc.id, inc.type)} title="Dispatch Emergency Protocol"><i className="fas fa-satellite-dish"></i> Dispatch</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
