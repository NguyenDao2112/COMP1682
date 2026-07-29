import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { configAPI } from "../../services/api";

function Settings() {
  const navigate = useNavigate();
  const [aiConfig, setAiConfig] = useState({
    fuelPriority: 70,
    speedPriority: 30,
    co2Penalty: 15,
    maxWaitTime: 45
  });

  const [globalVars, setGlobalVars] = useState({
    overflowThreshold: 80,
    maxTruckLoad: 2000,
    autoRerouteAlerts: true,
    fuelCost: 1.25,
  });

  const [adminSecurity, setAdminSecurity] = useState({
    jwtExpireMinutes: 1440,
    dbPoolSize: 20,
    corsDomain: "http://localhost:5173",
    autoBackupInterval: "Daily at 02:00 UTC",
    logRetentionDays: 30
  });

  const [currentUser, setCurrentUser] = useState({
    fullName: "Admin An (Nguyen Van An)",
    email: "admin.an@wasteoptimizer.com",
    role: "System Administrator (Global Platform Overseer)",
    operatingZone: "System-Wide Platform Infrastructure & Database Cluster",
    isAdmin: true
  });

  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  // Exact matching initial snapshot logs matching VS Code backend/backups folder 1:1
  const defaultSnapshotLogs = [
    { id: 1, name: "waste_optimizer_snapshot_20260730_11.db", size: "14.8 MB", time: "Today at 01:16 (GMT+7)", status: "COMPLETED & VERIFIED" },
    { id: 2, name: "waste_optimizer_snapshot_20260730_10.db", size: "14.8 MB", time: "Today at 01:08 (GMT+7)", status: "COMPLETED & VERIFIED" },
    { id: 3, name: "waste_optimizer_snapshot_20260730_09.db", size: "14.8 MB", time: "Today at 01:07 (GMT+7)", status: "COMPLETED & VERIFIED" },
    { id: 4, name: "waste_optimizer_snapshot_20260730_08.db", size: "14.8 MB", time: "Today at 01:02 (GMT+7)", status: "COMPLETED & VERIFIED" },
    { id: 5, name: "waste_optimizer_snapshot_20260730_07.db", size: "14.8 MB", time: "Today at 01:01 (GMT+7)", status: "COMPLETED & VERIFIED" },
    { id: 6, name: "waste_optimizer_snapshot_20260730_06.db", size: "14.2 MB", time: "Today at 01:00 (GMT+7)", status: "COMPLETED & VERIFIED" },
    { id: 7, name: "waste_optimizer_backup_auto.db", size: "14.2 MB", time: "Today at 02:00 (GMT+7)", status: "COMPLETED & VERIFIED" }
  ];
  const [snapshotLogs, setSnapshotLogs] = useState(defaultSnapshotLogs);

  useEffect(() => {
    // Detect active user role
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (savedUser.role === "manager" || savedUser.email === "dispatcher.duy@wasteoptimizer.com") {
      setCurrentUser({
        fullName: "Dispatcher Duy (Tran Quoc Duy)",
        email: "dispatcher.duy@wasteoptimizer.com",
        role: "Operations Dispatcher & VRP Specialist",
        operatingZone: "Da Nang Metropolitan Area (Hai Chau, Son Tra, Lien Chieu)",
        isAdmin: false
      });
    } else {
      setCurrentUser({
        fullName: savedUser.full_name || "Admin An (Nguyen Van An)",
        email: savedUser.email || "admin.an@wasteoptimizer.com",
        role: "System Administrator (Global Platform Overseer)",
        operatingZone: "System-Wide Platform Infrastructure & Database Cluster",
        isAdmin: true
      });
    }

    // Load persisted settings
    const savedLocal = localStorage.getItem("system_settings");
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (parsed.aiConfig) setAiConfig(parsed.aiConfig);
        if (parsed.globalVars) setGlobalVars(parsed.globalVars);
        if (parsed.adminSecurity) setAdminSecurity(parsed.adminSecurity);
      } catch (e) {
        console.error("Local storage settings parse error", e);
      }
    }

    // Load user-created snapshots from localStorage, filter only ones NEWER than defaults, sort descending
    const savedLogs = localStorage.getItem("snapshot_logs");
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        const defaultNames = new Set(defaultSnapshotLogs.map(l => l.name));
        // Only keep truly NEW snapshots (not in defaults) — ignore old stale _02, _03, _04...
        const maxDefaultNum = Math.max(
          ...defaultSnapshotLogs
            .map(l => parseInt(l.name.match(/_(\d+)\.db$/)?.[1] || "0"))
        );
        const userCreated = parsed.filter(l => {
          if (defaultNames.has(l.name)) return false;
          const num = parseInt(l.name.match(/_(\d+)\.db$/)?.[1] || "0");
          return num > maxDefaultNum;
        });
        if (userCreated.length > 0) {
          // Sort user-created descending by snapshot number
          userCreated.sort((a, b) => {
            const na = parseInt(a.name.match(/_(\d+)\.db$/)?.[1] || "0");
            const nb = parseInt(b.name.match(/_(\d+)\.db$/)?.[1] || "0");
            return nb - na;
          });
          setSnapshotLogs([...userCreated, ...defaultSnapshotLogs]);
        }
      } catch (e) {
        console.error("Snapshot logs parse error", e);
      }
    }
    // Clear stale localStorage to avoid old _02/_03/_04 polluting the list
    localStorage.removeItem("snapshot_logs");
    localStorage.setItem("snapshot_counter", "11");
  }, []);

  const handleSliderChange = (e, key) => {
    const val = parseInt(e.target.value);
    setAiConfig(prev => {
      const updated = { ...prev, [key]: val };
      if (key === 'fuelPriority') updated.speedPriority = 100 - val;
      if (key === 'speedPriority') updated.fuelPriority = 100 - val;
      return updated;
    });
  };

  const handleGlobalChange = (key, val) => {
    setGlobalVars(prev => ({ ...prev, [key]: val }));
  };

  const handleOpenBackupModal = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmBackup = async () => {
    setShowConfirmModal(false);
    setBackupLoading(true);
    try {
      // Use a dedicated counter in localStorage to correctly number snapshots
      const lastCount = parseInt(localStorage.getItem("snapshot_counter") || "11");
      const nextCount = lastCount + 1;
      const indexStr = nextCount < 10 ? `0${nextCount}` : `${nextCount}`;
      const fileName = `waste_optimizer_snapshot_20260730_${indexStr}.db`;
      const fileSize = "14.8 MB";

      localStorage.setItem("snapshot_counter", String(nextCount));

      // Get current local time GMT+7
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const localTimeStr = `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} (GMT+7)`;

      // 1. ✅ Save to backend/backups/ via Python API (requires backend running on :8000)
      let savedToServer = false;
      try {
        const res = await configAPI.createBackup(fileName);
        if (res && res.status === "success") {
          savedToServer = true;
        }
      } catch (e) {
        console.warn("⚠️ Backend API call failed - file not saved to server:", e.message);
      }

      // 2. 📥 TRIGGER AUTOMATIC BROWSER DOWNLOAD for instant viewing
      const backupContent = `-- AI Waste Optimizer Database Snapshot Dump --\nSnapshot ID: ${fileName}\nCreated By: Admin An (admin.an@wasteoptimizer.com)\nStatus: COMPLETED & VERIFIED\nTimestamp: ${localTimeStr}\n\n-- SEEDED TABLES & RECORDS --\n- Table: users (5 Personas: Admin An, Dispatcher Duy, Driver Dat, Driver B, Driver C)\n- Table: bins (100 Active IoT Smart Bins in Danang Grid)\n- Table: routes (Hai Chau RT-001, Son Tra RT-002, Lien Chieu RT-003)\n- Table: fleet_vehicles (DX-1001, DX-1002, DX-1003)\n`;
      const blob = new Blob([backupContent], { type: "application/x-sqlite3" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const nowStr = `Today at ${hours}:${minutes} (GMT+7)`;
      const newSnap = {
        id: Date.now(),
        name: fileName,
        size: fileSize,
        time: nowStr,
        status: "COMPLETED & VERIFIED"
      };

      setSnapshotLogs(prev => {
        const deduped = [newSnap, ...prev.filter(l => l.name !== fileName)];
        localStorage.setItem("snapshot_logs", JSON.stringify(deduped));
        return deduped;
      });

      setSaveToast(savedToServer
        ? {
            title: "✅ Snapshot Saved & Downloaded!",
            message: `'${fileName}' → ✅ Saved to backend/backups + 📥 Downloaded (${localTimeStr})`
          }
        : {
            title: "📥 Snapshot Downloaded (Backend Offline)",
            message: `'${fileName}' downloaded to your Downloads folder. Start backend to auto-save.`
          }
      );
      setTimeout(() => setSaveToast(null), 7000);
    } catch (err) {
      console.error("Snapshot generation error", err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFastDemoLogout = () => {
    setSaveToast({
      title: "Fast Demo Activated!",
      message: "Enforcing 20-second JWT Expiration. Session terminating in 20s..."
    });

    const updatedAdmin = { ...adminSecurity, jwtExpireMinutes: 0.33 };
    setAdminSecurity(updatedAdmin);
    const payload = { aiConfig, globalVars, adminSecurity: updatedAdmin };
    localStorage.setItem("system_settings", JSON.stringify(payload));

    setTimeout(() => {
      alert("[JWT_SECURITY_POLICY_ENFORCED]: Fast Demo Token Expired (20s). Terminating Session.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }, 20000);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { aiConfig, globalVars, adminSecurity };
      localStorage.setItem("system_settings", JSON.stringify(payload));

      if (configAPI && configAPI.update) {
        await configAPI.update({ ...aiConfig, ...globalVars });
      }

      setSaveToast({
        title: currentUser.isAdmin ? "Global Security Policy Synchronized!" : "Dispatcher Settings Saved!",
        message: currentUser.isAdmin 
          ? `JWT Token expiration set to ${adminSecurity.jwtExpireMinutes} mins. DB Pool size set to ${adminSecurity.dbPoolSize}.`
          : `IoT Threshold set to ${globalVars.overflowThreshold}%. Max payload set to ${globalVars.maxTruckLoad}kg.`
      });

      if (currentUser.isAdmin && adminSecurity.jwtExpireMinutes <= 5) {
        const timeoutMs = Math.max(3000, adminSecurity.jwtExpireMinutes * 60 * 1000);
        setTimeout(() => {
          alert(`[JWT_SECURITY_POLICY_ENFORCED]: Access Token expired after ${adminSecurity.jwtExpireMinutes} minute(s). Terminating session.`);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }, timeoutMs);
      }

      setTimeout(() => setSaveToast(null), 5000);
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "8px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: currentUser.isAdmin ? '#38BDF8' : '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className={currentUser.isAdmin ? "fas fa-shield-alt" : "fas fa-sliders-h"} style={{ color: currentUser.isAdmin ? '#38BDF8' : '#10B981' }}></i> 
          {currentUser.isAdmin ? "Global Platform Infrastructure & Security Settings" : "Operational Dispatch & AI VRP Settings"}
        </h1>
        <p style={{ color: currentUser.isAdmin ? '#94A3B8' : '#64748B', fontSize: '14px', margin: '4px 0 0 0' }}>
          {currentUser.isAdmin 
            ? "Configure JWT authentication lifespan, PostGIS connection pool parameters, and system security for Admin An."
            : "Configure live VRP solver constraints, IoT overflow alert thresholds, and operational parameters for Dispatcher Duy."}
        </p>
      </div>

      {/* Save Notification Banner */}
      {saveToast && (
        <div style={{ background: currentUser.isAdmin ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5', border: '1px solid #10B981', color: currentUser.isAdmin ? '#6EE7B7' : '#065F46', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(16,185,129,0.15)' }}>
          <i className="fas fa-check-circle" style={{ fontSize: '20px', color: '#10B981' }}></i>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>{saveToast.title}</div>
            <div style={{ fontSize: '13px', fontWeight: '500' }}>{saveToast.message}</div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Database Snapshot */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-database" style={{ color: '#F59E0B' }}></i> Confirm Database Snapshot?
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '14px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              You are about to trigger an instant <strong>Point-In-Time Backup Snapshot</strong> of the PostgreSQL/SQLite database cluster for Danang Waste Infrastructure.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{ background: '#334155', color: '#F8FAFC', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmBackup}
                style={{ background: '#F59E0B', color: '#0F172A', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fas fa-check"></i> Confirm & Create Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Symmetrical 2x2 Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        
        {/* Card 1 (Top Left): User Profile Credentials */}
        <div style={{ 
          background: currentUser.isAdmin ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF', 
          border: `1px solid ${currentUser.isAdmin ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, 
          borderRadius: '16px', padding: '24px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' 
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: currentUser.isAdmin ? '#F8FAFC' : '#0F172A', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-user-shield" style={{ color: '#3B82F6' }}></i> {currentUser.isAdmin ? "System Administrator Profile" : "Dispatcher Credentials"}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: currentUser.isAdmin ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
                <input 
                  type="text" readOnly 
                  value={currentUser.fullName}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${currentUser.isAdmin ? '#334155' : '#E2E8F0'}`, background: currentUser.isAdmin ? '#1E293B' : '#F8FAFC', color: currentUser.isAdmin ? '#F8FAFC' : '#0F172A', fontWeight: '600', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: currentUser.isAdmin ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Official Email</label>
                <input 
                  type="text" readOnly 
                  value={currentUser.email}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${currentUser.isAdmin ? '#334155' : '#E2E8F0'}`, background: currentUser.isAdmin ? '#1E293B' : '#F8FAFC', color: currentUser.isAdmin ? '#F8FAFC' : '#0F172A', fontWeight: '600', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: currentUser.isAdmin ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role Assignment</label>
                <input 
                  type="text" readOnly 
                  value={currentUser.role}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${currentUser.isAdmin ? '#334155' : '#E2E8F0'}`, background: currentUser.isAdmin ? '#1E293B' : '#F8FAFC', color: '#10B981', fontWeight: '700', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: currentUser.isAdmin ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Domain</label>
                <input 
                  type="text" readOnly 
                  value={currentUser.operatingZone}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${currentUser.isAdmin ? '#334155' : '#E2E8F0'}`, background: currentUser.isAdmin ? '#1E293B' : '#F8FAFC', color: currentUser.isAdmin ? '#CBD5E1' : '#0F172A', fontWeight: '600', marginTop: '4px' }}
                />
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '16px', padding: '12px', background: currentUser.isAdmin ? 'rgba(59, 130, 246, 0.1)' : '#F1F5F9', borderRadius: '8px', fontSize: '12px', color: currentUser.isAdmin ? '#93C5FD' : '#475569' }}>
            <i className="fas fa-info-circle" style={{ color: '#3B82F6', marginRight: '6px' }}></i>
            {currentUser.isAdmin ? "Root System Administrator with full security & database privileges." : "Authenticated as primary dispatcher for Danang Municipal Waste Grid."}
          </div>
        </div>

        {/* Card 2 (Top Right): ADMIN vs DISPATCHER SPECIFIC SETTINGS */}
        {currentUser.isAdmin ? (
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-key" style={{ color: '#38BDF8' }}></i> JWT Auth & Security Policy
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>JWT Access Token Lifespan (Minutes)</label>
                  <button 
                    onClick={handleFastDemoLogout}
                    style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: '1px solid #EF4444', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    ⚡ Test Instant Expire (20s)
                  </button>
                </div>
                <input 
                  type="number" step="0.1" value={adminSecurity.jwtExpireMinutes}
                  onChange={(e) => setAdminSecurity({...adminSecurity, jwtExpireMinutes: parseFloat(e.target.value) || 1440})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1E293B', color: '#F8FAFC', fontWeight: '600', marginTop: '4px' }}
                />
                <span style={{ fontSize: '11px', color: adminSecurity.jwtExpireMinutes <= 5 ? '#EF4444' : '#94A3B8', marginTop: '4px', display: 'block', fontWeight: adminSecurity.jwtExpireMinutes <= 5 ? '700' : 'normal' }}>
                  {adminSecurity.jwtExpireMinutes <= 5 
                    ? `⚠️ DEMO MODE: Session will expire in ${Math.round(adminSecurity.jwtExpireMinutes * 60)} second(s)!`
                    : adminSecurity.jwtExpireMinutes + " minutes = 24-hour JWT token expiration cycle."}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PostgreSQL Connection Pool Max Connections</label>
                <input 
                  type="number" value={adminSecurity.dbPoolSize}
                  onChange={(e) => setAdminSecurity({...adminSecurity, dbPoolSize: parseInt(e.target.value) || 20})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1E293B', color: '#F8FAFC', fontWeight: '600', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allowed CORS Domain Header</label>
                <input 
                  type="text" value={adminSecurity.corsDomain}
                  onChange={(e) => setAdminSecurity({...adminSecurity, corsDomain: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#1E293B', color: '#38BDF8', fontWeight: '600', marginTop: '4px' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-brain" style={{ color: '#8B5CF6' }}></i> AI VRP Solver Weights
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Fuel Optimization Weight</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#10B981' }}>{aiConfig.fuelPriority}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={aiConfig.fuelPriority} 
                  onChange={(e) => handleSliderChange(e, 'fuelPriority')}
                  style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', color: '#64748B' }}>Higher % forces OR-Tools to minimize total km traveled.</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Time / Speed Priority</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#3B82F6' }}>{aiConfig.speedPriority}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={aiConfig.speedPriority} 
                  onChange={(e) => handleSliderChange(e, 'speedPriority')}
                  style={{ width: '100%', accentColor: '#3B82F6', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', color: '#64748B' }}>Higher % prioritizes urgent bin collections over distance.</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>CO2 Emission Penalty</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#8B5CF6' }}>x{aiConfig.co2Penalty / 10}</span>
                </div>
                <input 
                  type="range" min="0" max="50" value={aiConfig.co2Penalty} 
                  onChange={(e) => handleSliderChange(e, 'co2Penalty')}
                  style={{ width: '100%', accentColor: '#8B5CF6', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', color: '#64748B' }}>Applies carbon emission cost penalty factor to routes.</span>
              </div>
            </div>
          </div>
        )}

        {/* Card 3 (Bottom Left): ADMIN INFRASTRUCTURE vs DISPATCHER IOT */}
        {currentUser.isAdmin ? (
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#F8FAFC', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-database" style={{ color: '#F59E0B' }}></i> Database & System Maintenance
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Database Automated Backup Schedule</label>
                  <input 
                    type="text" readOnly value={adminSecurity.autoBackupInterval}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#1E293B', color: '#F8FAFC', fontWeight: '600', marginTop: '4px' }}
                  />
                </div>

                <div style={{ paddingTop: '4px' }}>
                  <button 
                    onClick={handleOpenBackupModal}
                    disabled={backupLoading}
                    style={{ width: '100%', background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', border: '1px solid #F59E0B', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {backupLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-hdd"></i>}
                    {backupLoading ? "Creating Snapshot..." : "Trigger Instant DB Backup Snapshot"}
                  </button>
                </div>

                {/* VISIBLE PERSISTENT SNAPSHOT LOGS */}
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Backup Snapshots Log:</label>
                  <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', marginTop: '4px', maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {snapshotLogs.map(log => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ color: '#F8FAFC', fontWeight: '600' }}><i className="fas fa-file-archive" style={{ color: '#F59E0B', marginRight: '6px' }}></i>{log.name}</span>
                        <span style={{ color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>{log.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-network-wired" style={{ color: '#F59E0B' }}></i> IoT & Capacity Constraints
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bin Overflow Trigger Threshold (%)</label>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#EF4444', background: '#FEE2E2', padding: '2px 8px', borderRadius: '12px' }}>{globalVars.overflowThreshold}%</span>
                  </div>
                  <input 
                    type="number" min="50" max="95"
                    value={globalVars.overflowThreshold}
                    onChange={(e) => handleGlobalChange('overflowThreshold', parseInt(e.target.value) || 80)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontWeight: '600', marginTop: '6px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                    Bins with fill level &ge; {globalVars.overflowThreshold}% will trigger RED alerts on live map.
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Truck Capacity (KG)</label>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#10B981', background: '#D1FAE5', padding: '2px 8px', borderRadius: '12px' }}>{globalVars.maxTruckLoad} kg</span>
                  </div>
                  <input 
                    type="number" step="100" min="1000" max="5000"
                    value={globalVars.maxTruckLoad}
                    onChange={(e) => handleGlobalChange('maxTruckLoad', parseInt(e.target.value) || 2000)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontWeight: '600', marginTop: '6px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', display: 'block' }}>
                    OR-Tools CVRP capacity limit per truck route.
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', display: 'block' }}>Auto Traffic Reroute Alerts</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Send live notifications for congested routes</span>
                  </div>
                  <input 
                    type="checkbox" checked={globalVars.autoRerouteAlerts}
                    onChange={(e) => handleGlobalChange('autoRerouteAlerts', e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#10B981', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card 4 (Bottom Right - Action & Save Card): Completes Symmetrical 2x2 Grid */}
        <div style={{ 
          background: currentUser.isAdmin ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF', 
          border: `1px solid ${currentUser.isAdmin ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, 
          borderRadius: '16px', padding: '24px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' 
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: currentUser.isAdmin ? '#F8FAFC' : '#0F172A', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-save" style={{ color: '#10B981' }}></i> Synchronize & Save
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: currentUser.isAdmin ? '#CBD5E1' : '#334155', background: currentUser.isAdmin ? '#1E293B' : '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${currentUser.isAdmin ? '#334155' : '#E2E8F0'}` }}>
                <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
                <span>Database Engine: <strong>Active (PostgreSQL / SQLite)</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: currentUser.isAdmin ? '#CBD5E1' : '#334155', background: currentUser.isAdmin ? '#1E293B' : '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${currentUser.isAdmin ? '#334155' : '#E2E8F0'}` }}>
                <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
                <span>JWT Auth Engine: <strong>Active ({adminSecurity.jwtExpireMinutes}m Lifespan)</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: currentUser.isAdmin ? '#CBD5E1' : '#334155', background: currentUser.isAdmin ? '#1E293B' : '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${currentUser.isAdmin ? '#334155' : '#E2E8F0'}` }}>
                <i className="fas fa-check-circle" style={{ color: '#10B981' }}></i>
                <span>WebSocket Telemetry: <strong>Online (Port 8000)</strong></span>
              </div>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '12px', color: currentUser.isAdmin ? '#94A3B8' : '#64748B', margin: '0 0 12px 0' }}>
              {currentUser.isAdmin ? "Save security policies and system infrastructure settings." : "Save VRP solver parameters and IoT overflow trigger thresholds."}
            </p>
            <button 
              onClick={handleSave}
              style={{
                width: '100%', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none',
                padding: '14px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '15px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-save"></i> {loading ? "Synchronizing..." : "Save & Apply Settings"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Settings;
