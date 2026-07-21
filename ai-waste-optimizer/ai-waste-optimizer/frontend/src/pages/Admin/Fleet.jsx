import React, { useState, useEffect } from "react";
import { routesAPI } from "../../services/api";

function Fleet() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceAssets, setMaintenanceAssets] = useState(new Set());
  
  // Modal & Toast States
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [assetType, setAssetType] = useState('truck'); // 'truck' or 'bin'
  const [assetForm, setAssetForm] = useState({ id: '', location: '', capacity: '' });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const data = await routesAPI.getAll();
        setRoutes(data || []);
      } catch (err) {
        console.error("Failed to fetch routes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const showToast = (title, desc, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleToggleMaintenance = (routeId, vehicleId) => {
    setMaintenanceAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
        showToast("System Online", `Vehicle ${vehicleId} is back online and ready for deployment.`, "success");
      } else {
        newSet.add(routeId);
        showToast("Maintenance Override", `Vehicle ${vehicleId} locked for emergency maintenance.`, "warning");
      }
      return newSet;
    });
  };

  const handleDeleteVehicle = async (routeId, vehicleId) => {
    if (window.confirm(`Are you sure you want to decommission ${vehicleId || "this vehicle"}?`)) {
      try {
        await routesAPI.delete(routeId);
        setRoutes(routes.filter(r => r.id !== routeId));
        showToast("Decommission Complete", `Vehicle ${vehicleId} removed from registry.`, "success");
      } catch (err) {
        showToast("Error", "Failed to decommission vehicle.", "warning");
      }
    }
  };

  const handleProvisionAsset = (e) => {
    e.preventDefault();
    showToast("Provisioning Initialized", `Deploying new ${assetType.toUpperCase()} asset to the grid. Setup complete.`, "success");
    setShowProvisionModal(false);
    setAssetForm({ id: '', location: '', capacity: '' });
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast Notifications */}
      <div className="toast-container" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
        {toasts.map(toast => (
          <div key={toast.id} className="custom-toast" style={{
            background: 'rgba(10, 15, 20, 0.95)',
            border: `1px solid ${toast.type === 'success' ? 'var(--admin-emerald)' : toast.type === 'warning' ? 'var(--admin-warning)' : 'var(--admin-cyan)'}`,
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '10px',
            color: '#fff',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            boxShadow: `0 0 20px ${toast.type === 'success' ? 'rgba(16,185,129,0.2)' : toast.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(6,182,212,0.2)'}`,
            animation: 'slideInRight 0.3s ease-out forwards'
          }}>
            <div style={{ 
              color: toast.type === 'success' ? 'var(--admin-emerald)' : toast.type === 'warning' ? 'var(--admin-warning)' : 'var(--admin-cyan)',
              fontSize: '20px'
            }}>
              {toast.type === 'success' ? <i className="fas fa-check-circle"></i> : 
               toast.type === 'warning' ? <i className="fas fa-exclamation-triangle"></i> : 
               <i className="fas fa-info-circle"></i>}
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>{toast.title}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--admin-text-muted)' }}>{toast.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <h1 className="cmd-panel-title" style={{fontSize: '28px', margin: 0}}>
          <i className="fas fa-truck-moving" style={{color: 'var(--admin-emerald)'}}></i> GLOBAL FLEET ASSETS
        </h1>
        <div style={{display: 'flex', gap: '16px'}}>
          <button className="cyber-btn" onClick={() => setShowProvisionModal(true)} style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--admin-emerald)', color: 'var(--admin-emerald)' }}>
            <i className="fas fa-plus"></i> Provision Asset
          </button>
          <button className="cyber-btn">
            <i className="fas fa-download"></i> Export Registry
          </button>
        </div>
      </div>

      {/* Macro Map Simulation */}
      <div className="cmd-panel" style={{marginBottom: '24px', padding: 0, height: '400px', position: 'relative', overflow: 'hidden'}}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'url(https://cartodb-basemaps-c.global.ssl.fastly.net/dark_all/16/52431/29446.png) center/cover',
          opacity: 0.7
        }}></div>
        <div style={{position: 'absolute', top: '50%', left: '40%', fontSize: '20px', color: 'var(--admin-emerald)', textShadow: '0 0 15px var(--admin-emerald)', animation: 'pulse 1.5s infinite'}}><i className="fas fa-truck"></i></div>
        <div style={{position: 'absolute', top: '30%', left: '60%', fontSize: '20px', color: 'var(--admin-cyan)', textShadow: '0 0 15px var(--admin-cyan)', animation: 'pulse 2s infinite'}}><i className="fas fa-truck"></i></div>
        <div style={{position: 'absolute', top: '70%', left: '50%', fontSize: '20px', color: 'var(--admin-warning)', textShadow: '0 0 15px var(--admin-warning)', animation: 'pulse 1s infinite'}}><i className="fas fa-truck"></i></div>
        
        <div style={{position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.8)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--admin-border)'}}>
          <div style={{fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '4px'}}>LIVE SATELLITE TRACKING</div>
          <div style={{display: 'flex', gap: '16px'}}>
            <span style={{color: 'var(--admin-emerald)'}}><i className="fas fa-truck" style={{fontSize: '10px'}}></i> Active</span>
            <span style={{color: 'var(--admin-cyan)'}}><i className="fas fa-truck" style={{fontSize: '10px'}}></i> Returning</span>
            <span style={{color: 'var(--admin-warning)'}}><i className="fas fa-truck" style={{fontSize: '10px'}}></i> Refueling</span>
          </div>
        </div>
      </div>

      {/* Asset Registry Table */}
      <div className="cmd-panel">
        <h3 className="cmd-panel-title"><i className="fas fa-clipboard-list"></i> Fleet Asset Registry</h3>
        
        <div style={{overflowX: 'auto'}}>
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>Assigned Driver</th>
                <th>Route Territory</th>
                <th>Status</th>
                <th>Health / Maintenance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{textAlign: 'center', color: 'var(--admin-cyan)'}}>Decrypting Asset Data...</td></tr>
              ) : routes.length > 0 ? (
                routes.map(route => {
                  const isMaintenance = maintenanceAssets.has(route.id);
                  return (
                    <tr key={route.id} style={{ opacity: isMaintenance ? 0.6 : 1, transition: 'all 0.3s ease' }}>
                      <td style={{fontFamily: 'monospace', color: isMaintenance ? 'var(--admin-warning)' : '#fff'}}>
                        {isMaintenance && <i className="fas fa-wrench" style={{marginRight: '8px'}}></i>}
                        {route.vehicle_id || "UNASSIGNED"}
                      </td>
                      <td>{route.driver_name || "N/A"}</td>
                      <td>{route.route_name}</td>
                      <td>
                        {isMaintenance ? (
                          <span className="cyber-badge" style={{background: 'rgba(245, 158, 11, 0.1)', color: 'var(--admin-warning)', border: '1px solid var(--admin-warning)'}}>Maintenance</span>
                        ) : route.status === 'in_progress' ? (
                          <span className="cyber-badge badge-emerald">On Mission</span>
                        ) : route.status === 'completed' ? (
                          <span className="cyber-badge badge-purple">Standby</span>
                        ) : (
                          <span className="cyber-badge badge-cyan">Scheduled</span>
                        )}
                      </td>
                      <td>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <div style={{flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px'}}>
                            <div style={{
                              height: '100%', 
                              width: isMaintenance ? '15%' : '85%', 
                              background: isMaintenance ? 'var(--admin-warning)' : 'var(--admin-emerald)',
                              transition: 'width 1s ease-in-out'
                            }}></div>
                          </div>
                          <span style={{fontSize: '12px', color: isMaintenance ? 'var(--admin-warning)' : 'var(--admin-text-muted)'}}>
                            {isMaintenance ? 'ERR' : '85%'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button 
                            className="cyber-btn" 
                            style={{
                              padding: '6px 10px', fontSize: '12px', 
                              borderColor: isMaintenance ? 'var(--admin-emerald)' : 'var(--admin-warning)', 
                              color: isMaintenance ? 'var(--admin-emerald)' : 'var(--admin-warning)'
                            }}
                            onClick={() => handleToggleMaintenance(route.id, route.vehicle_id)}
                          >
                            <i className={`fas ${isMaintenance ? 'fa-play' : 'fa-tools'}`}></i>
                          </button>
                          <button className="cyber-btn" style={{padding: '6px 10px', fontSize: '12px'}} disabled={isMaintenance}>
                            <i className="fas fa-search"></i>
                          </button>
                          <button 
                            className="cyber-btn" 
                            style={{padding: '6px 10px', fontSize: '12px', borderColor: 'var(--admin-danger)', color: 'var(--admin-danger)'}} 
                            onClick={() => handleDeleteVehicle(route.id, route.vehicle_id)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="6" style={{textAlign: 'center', color: 'var(--admin-text-muted)'}}>No fleet data available in global registry.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Asset Modal */}
      {showProvisionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="cmd-panel" style={{ width: '500px', maxWidth: '90%', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>
              <h2 style={{ margin: 0, color: 'var(--admin-emerald)', fontSize: '20px', letterSpacing: '1px' }}>
                <i className="fas fa-satellite-dish"></i> PROVISION NEW ASSET
              </h2>
              <button className="cyber-btn" onClick={() => setShowProvisionModal(false)} style={{ padding: '6px 10px', borderColor: 'rgba(255,255,255,0.2)', color: 'var(--admin-text-muted)' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button 
                className="cyber-btn" 
                style={{ flex: 1, background: assetType === 'truck' ? 'rgba(16, 185, 129, 0.1)' : 'transparent', borderColor: assetType === 'truck' ? 'var(--admin-emerald)' : 'rgba(255,255,255,0.2)', color: assetType === 'truck' ? 'var(--admin-emerald)' : 'var(--admin-text-muted)' }}
                onClick={() => setAssetType('truck')}
              >
                <i className="fas fa-truck"></i> Fleet Vehicle
              </button>
              <button 
                className="cyber-btn" 
                style={{ flex: 1, background: assetType === 'bin' ? 'rgba(6, 182, 212, 0.1)' : 'transparent', borderColor: assetType === 'bin' ? 'var(--admin-cyan)' : 'rgba(255,255,255,0.2)', color: assetType === 'bin' ? 'var(--admin-cyan)' : 'var(--admin-text-muted)' }}
                onClick={() => setAssetType('bin')}
              >
                <i className="fas fa-trash-alt"></i> Smart Bin
              </button>
            </div>

            <form onSubmit={handleProvisionAsset}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--admin-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Asset Identifier
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={assetType === 'truck' ? "e.g., TRUCK_005" : "e.g., BIN_105"}
                  value={assetForm.id}
                  onChange={e => setAssetForm({...assetForm, id: e.target.value})}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '12px', borderRadius: '4px', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--admin-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Deployment Sector
                </label>
                <select 
                  required
                  value={assetForm.location}
                  onChange={e => setAssetForm({...assetForm, location: e.target.value})}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '12px', borderRadius: '4px' }}
                >
                  <option value="" disabled>Select Sector Grid...</option>
                  <option value="hai_chau">Sector Alpha (Hai Chau)</option>
                  <option value="son_tra">Sector Beta (Son Tra)</option>
                  <option value="thanh_khe">Sector Gamma (Thanh Khe)</option>
                </select>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--admin-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {assetType === 'truck' ? 'Cargo Capacity (kg)' : 'Volume Capacity (L)'}
                </label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g., 5000"
                  value={assetForm.capacity}
                  onChange={e => setAssetForm({...assetForm, capacity: e.target.value})}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '12px', borderRadius: '4px', fontFamily: 'monospace' }}
                />
              </div>

              <button type="submit" className="cyber-btn" style={{ width: '100%', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--admin-emerald)', color: 'var(--admin-emerald)', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>
                <i className="fas fa-satellite"></i> INITIALIZE DEPLOYMENT
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Fleet;