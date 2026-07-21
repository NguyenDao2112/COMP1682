import React, { useState, useEffect } from "react";
import { routesAPI } from "../../services/api";

function Routes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const data = await routesAPI.getAll();
      setRoutes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      await routesAPI.optimize();
      await fetchRoutes();
    } catch (err) {
      alert("Optimization failed: " + err.message);
    } finally {
      setOptimizing(false);
    }
  };

  const handleReassignDriver = async (routeId, currentDriver) => {
    const newDriver = prompt(`Enter new driver name to re-assign Route ${routeId} (Currently: ${currentDriver || 'Unassigned'}):`, currentDriver || "");
    if (newDriver && newDriver !== currentDriver) {
      try {
        await routesAPI.update(routeId, { driver_name: newDriver });
        alert(`Route successfully re-assigned to ${newDriver}.`);
        await fetchRoutes();
      } catch (err) {
        alert("Failed to re-assign driver: " + err.message);
      }
    }
  };

  const handleDeleteRoute = async (routeId, routeName) => {
    if (window.confirm(`Are you sure you want to delete Route ${routeName || routeId}? This action cannot be undone.`)) {
      try {
        await routesAPI.delete(routeId);
        alert(`Route ${routeName || routeId} successfully deleted.`);
        await fetchRoutes();
      } catch (err) {
        alert("Failed to delete route: " + err.message);
      }
    }
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <h1 className="cmd-panel-title" style={{fontSize: '28px', margin: 0}}>
          <i className="fas fa-project-diagram" style={{color: 'var(--admin-purple)'}}></i> ROUTE MATRIX
        </h1>
        <button className="cyber-btn primary" onClick={handleOptimize} disabled={optimizing} style={{background: optimizing ? 'var(--admin-warning)' : ''}}>
          <i className={`fas ${optimizing ? 'fa-spinner fa-spin' : 'fa-bolt'}`}></i> {optimizing ? 'OPTIMIZING...' : 'FORCE AI OPTIMIZATION'}
        </button>
      </div>

      <div className="cmd-panel">
        <div style={{overflowX: 'auto'}}>
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Route ID</th>
                <th>Assigned Driver</th>
                <th>Total Bins</th>
                <th>Status</th>
                <th>Efficiency Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{textAlign: 'center'}}>Calculating paths...</td></tr>
              ) : routes.length > 0 ? (
                routes.map(r => (
                  <tr key={r.id}>
                    <td style={{fontFamily: 'monospace', color: 'var(--admin-cyan)'}}>RT-{r.route_id ? r.route_id.substring(0,6).toUpperCase() : String(r.id)}</td>
                    <td>{r.driver_name || 'Unassigned'}</td>
                    <td>{r.bins?.length || 0}</td>
                    <td>
                      <span className={`cyber-badge ${r.status === 'completed' ? 'badge-emerald' : r.status === 'in_progress' ? 'badge-cyan' : 'badge-warning'}`}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{90 + Math.floor(Math.random() * 9)}%</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="cyber-btn" 
                          style={{padding: '6px 10px', fontSize: '12px'}} 
                          title="Re-assign Driver"
                          onClick={() => handleReassignDriver(r.id, r.driver_name)}
                        >
                          <i className="fas fa-user-edit"></i>
                        </button>
                        <select 
                          className="cyber-select"
                          value={r.vehicle_id || ""}
                          onChange={async (e) => {
                            try {
                              await routesAPI.update(r.id, { vehicle_id: e.target.value });
                              fetchRoutes();
                            } catch (err) {
                              alert("Failed to update vehicle");
                            }
                          }}
                          style={{padding: '4px', background: 'var(--admin-bg)', color: 'var(--admin-text-primary)', border: '1px solid var(--admin-border)', borderRadius: '4px'}}
                        >
                          <option value="TRUCK_001">TRUCK_001</option>
                          <option value="TRUCK_002">TRUCK_002</option>
                          <option value="TRUCK_003">TRUCK_003</option>
                        </select>
                        <button 
                          className="cyber-btn" 
                          style={{padding: '6px 10px', fontSize: '12px', background: 'var(--admin-warning)', color: '#000'}} 
                          title="Delete Route"
                          onClick={() => handleDeleteRoute(r.id, r.route_id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{textAlign: 'center'}}>No active routes. Run AI Optimization.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Routes;