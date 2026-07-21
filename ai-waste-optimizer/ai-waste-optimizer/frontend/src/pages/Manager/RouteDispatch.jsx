import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import { routesAPI, vehiclesAPI, usersAPI } from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import { setupLeafletIcons, DANANG_CENTER, createFleetIcon } from "../../components/maps/mapUtils";
import "./Manager.css";

function MapUpdater({ path }) {
  const map = useMap();
  useEffect(() => {
    if (path && path.length > 0) {
      map.fitBounds(path, { padding: [50, 50] });
    }
  }, [path, map]);
  return null;
}

setupLeafletIcons();

export default function RouteDispatch() {
  const { darkMode } = useTheme();
  
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState([]);
  const [dispatchSettings, setDispatchSettings] = useState({ driver_name: '', vehicle_id: '' });
  
  // Simulation states
  const [truckPosIndex, setTruckPosIndex] = useState(0);
  const [isDispatching, setIsDispatching] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  const mapUrl = darkMode 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

  // Fetch initial data
  const fetchRoutes = async () => {
    try {
      const rData = await routesAPI.getAll();
      setRoutes(rData);
      return rData;
    } catch (err) {
      showToast("Error", "Failed to load dispatch data.", "warning");
      return [];
    }
  };

  useEffect(() => {
    const init = async () => {
      const rData = await fetchRoutes();
      if (rData.length > 0) {
        setSelectedRoute(rData[0]);
        setDispatchSettings({ driver_name: rData[0].driver_name, vehicle_id: rData[0].vehicle_id });
      }
    };
    init();
  }, []);

  // Fetch OSRM Geometry
  useEffect(() => {
    const fetchOSRMGeometry = async () => {
      if (!selectedRoute || !selectedRoute.path || selectedRoute.path.length < 2) {
        setRouteGeometry([]);
        return;
      }
      
      try {
        // OSRM expects longitude,latitude
        const coordsStr = selectedRoute.path.map(p => `${p[1]},${p[0]}`).join(';');
        
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          // OSRM returns coordinates as [lon, lat], Leaflet needs [lat, lon]
          const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteGeometry(coords);
        } else {
          setRouteGeometry(selectedRoute.path);
        }
      } catch (err) {
        console.error("OSRM fetch failed:", err);
        setRouteGeometry(selectedRoute.path);
      }
    };
    
    fetchOSRMGeometry();
  }, [selectedRoute]);

  // Truck Animation Loop
  useEffect(() => {
    if (!selectedRoute || !selectedRoute.path || selectedRoute.path.length === 0) return;
    
    // Only animate if status is in_progress
    if (selectedRoute.status !== 'in_progress' && !isDispatching) return;

    const interval = setInterval(() => {
      setTruckPosIndex((prev) => {
        if (prev >= selectedRoute.path.length - 1) return 0; // Loop back
        return prev + 1;
      });
    }, 1500); // Move every 1.5s

    return () => clearInterval(interval);
  }, [selectedRoute, isDispatching]);

  const showToast = (title, desc, type = "info") => {
    const newToast = { id: Date.now(), title, desc, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== newToast.id)), 4000);
  };

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    setDispatchSettings({ driver_name: route.driver_name, vehicle_id: route.vehicle_id });
    setTruckPosIndex(0); // Reset animation
  };

  // Toggle route status: completed <-> pending
  const handleToggleStatus = async (route, e) => {
    e.stopPropagation(); // Don't trigger route selection
    try {
      const newStatus = route.status === 'completed' ? 'pending' : 'completed';
      await routesAPI.update(route.id, { status: newStatus });
      
      // Refresh all routes
      const refreshed = await fetchRoutes();
      
      // Update selected route if it's the one we changed
      if (selectedRoute && selectedRoute.id === route.id) {
        const updated = refreshed.find(r => r.id === route.id);
        setSelectedRoute(updated);
        setDispatchSettings({ driver_name: updated.driver_name, vehicle_id: updated.vehicle_id });
      }
      
      showToast("Status Updated", `${route.route_name} → ${newStatus.toUpperCase()}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Error", "Failed to update status.", "warning");
    }
  };

  // We no longer require all routes to be completed. 
  // We only require that the routes involved in the swap are not 'in_progress'.

  const handleDispatch = async () => {
    try {
      setIsDispatching(true);
      
      // Check if user is trying to switch to a different driver
      const isDriverSwap = dispatchSettings.driver_name !== selectedRoute.driver_name;
      
      if (isDriverSwap) {
        // Find the other route that currently has the requested driver
        const otherRoute = routes.find(r => r.id !== selectedRoute.id && r.driver_name === dispatchSettings.driver_name);
        
        if (!otherRoute) {
          // The driver is freely available
          await routesAPI.update(selectedRoute.id, { driver_name: dispatchSettings.driver_name, status: 'in_progress' });
          const finalRoutes = await fetchRoutes();
          const updatedSelected = finalRoutes.find(r => r.id === selectedRoute.id);
          setSelectedRoute(updatedSelected);
          showToast("Dispatched", "Free driver assigned and route dispatched.", "success");
          setIsDispatching(false);
          return;
        }
        
        // Both routes involved in the swap must not be in_progress
        if (selectedRoute.status === 'in_progress' || otherRoute.status === 'in_progress') {
          showToast("Cannot Switch", "Cannot switch drivers while a route is IN_PROGRESS.", "warning");
          setIsDispatching(false);
          return;
        }
        
        // Call swap-trucks API (which we will repurpose to swap drivers)
        await routesAPI.swapTrucks(selectedRoute.id, otherRoute.id);
        
        // Now set the selected route's status to in_progress
        await routesAPI.update(selectedRoute.id, { status: 'in_progress' });
        
        // Fetch fresh data to get the final state with correct coordinates
        const finalRoutes = await fetchRoutes();
        
        const updatedSelected = finalRoutes.find(r => r.id === selectedRoute.id);
        setSelectedRoute(updatedSelected);
        setDispatchSettings({ driver_name: updatedSelected.driver_name, vehicle_id: updatedSelected.vehicle_id });
        setTruckPosIndex(0);
        
        showToast("Routes Swapped & Dispatched!", `${updatedSelected.driver_name} now dispatched on ${updatedSelected.route_name} with ${updatedSelected.vehicle_id}.`, "success");
      } else {
        // Normal dispatch without swap - just start the route
        await routesAPI.update(selectedRoute.id, { 
          status: 'in_progress',
          vehicle_id: dispatchSettings.vehicle_id
        });
        
        // Refresh from backend
        const finalRoutes = await fetchRoutes();
        const updatedSelected = finalRoutes.find(r => r.id === selectedRoute.id);
        setSelectedRoute(updatedSelected);
        
        showToast("Route Dispatched!", `Route ${selectedRoute.route_id} dispatched to ${dispatchSettings.driver_name}.`, "success");
      }
      
      setIsDispatching(false);
    } catch (err) {
      console.error(err);
      showToast("Dispatch Failed", err.message || "Could not dispatch route. Please try again.", "warning");
      setIsDispatching(false);
    }
  };

  const handleAIOptimize = async () => {
    try {
      showToast("AI Optimization Running", "Recalculating optimal paths using OR-Tools VRP...", "info");
      
      const result = await routesAPI.optimize();
      
      showToast("Optimization Complete", `Successfully routed ${result.vehicles_routed} vehicles with new paths.`, "success");
      
      // Refetch routes to update map
      const updatedRoutes = await fetchRoutes();
      
      // Update selected route if it exists
      if (selectedRoute) {
        const updatedSelected = updatedRoutes.find(r => r.id === selectedRoute.id);
        if (updatedSelected) {
          setSelectedRoute(updatedSelected);
          setTruckPosIndex(0);
        }
      }
      
    } catch (err) {
      console.error(err);
      showToast("Optimization Failed", err.message || "Failed to calculate optimal routes.", "error");
    }
  };

  // Determine if the vehicle dropdown should allow switching
  const canSwitchVehicle = selectedRoute && selectedRoute.status !== 'in_progress';

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
      showToast("Request Sent", "Provision request sent to Admin for approval.", "success");
    } catch (e) {
      showToast("Error", "Failed to send provision request.", "error");
    }
  };

  return (
    <div className={`manager-dashboard route-dispatch-container ${darkMode ? "dark" : ""}`}>
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
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
      </div>

      <header className="dashboard-top-bar" style={{marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div>
          <h1 className="page-title">Route Dispatch</h1>
          <p style={{color: "var(--dash-text-muted)", margin: "4px 0 0 0", fontSize: "14px"}}>Assign drivers and optimize fleet operations</p>
        </div>
        <button 
          onClick={handleRequestProvision}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 16px", borderRadius: "8px", border: "none",
            background: "var(--dash-brand-warning)",
            color: "#fff", fontWeight: "600", cursor: "pointer",
            boxShadow: "0 4px 14px 0 rgba(245, 158, 11, 0.3)",
            transition: "transform 0.2s"
        }}>
          <i className="fas fa-paper-plane"></i> Send Admin Request
        </button>
      </header>

      <div className="dispatch-content">
        {/* Left Column: List & Controls */}
        <div className="dispatch-sidebar">
          <div className="sidebar-section">
            <div className="section-header">
              <h3>Available Routes</h3>
              <button className="btn-ai" onClick={handleAIOptimize}>
                <i className="fas fa-magic"></i> AI Optimize
              </button>
            </div>
            
            <div className="route-list">
              {routes.map(route => (
                <div 
                  key={route.id} 
                  className={`route-card ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                  onClick={() => handleSelectRoute(route)}
                >
                  <div className="route-card-top">
                    <h4>{route.route_name}</h4>
                    <span 
                      className={`status-badge ${route.status === 'in_progress' ? 'transit' : route.status === 'completed' ? 'completed' : 'depot'}`}
                      onClick={(e) => handleToggleStatus(route, e)}
                      style={{ cursor: 'pointer' }}
                      title="Click to toggle status"
                    >
                      {route.status === 'in_progress' ? 'IN TRANSIT' : route.status === 'completed' ? 'COMPLETED' : 'AT DEPOT'}
                    </span>
                  </div>
                  <div className="route-card-details">
                    <p><i className="fas fa-barcode"></i> {route.route_id}</p>
                    <p><i className="fas fa-truck"></i> {route.vehicle_id}</p>
                    <p><i className="fas fa-user"></i> {route.driver_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedRoute && (
            <div className="sidebar-section dispatch-controls">
              <h3>Dispatch Settings</h3>
              
              {/* Assign Driver - Switchable only when all routes completed */}
              <div className="form-group">
                <label>Assign Driver {!canSwitchVehicle && <span style={{fontSize: '0.75rem', opacity: 0.6}}>(complete all routes to switch)</span>}</label>
                <select 
                  className="dispatch-select" 
                  value={dispatchSettings.driver_name}
                  onChange={(e) => setDispatchSettings({...dispatchSettings, driver_name: e.target.value})}
                  disabled={!canSwitchVehicle || isDispatching}
                >
                  {["Nguyen Van Tuan", "Tran Van B", "Le Van C"].map(driver => (
                    <option key={driver} value={driver}>{driver}</option>
                  ))}
                </select>
              </div>

              {/* Assign Vehicle - LOCKED (belongs to the route) */}
              <div className="form-group">
                <label>Assign Vehicle</label>
                <select 
                  className="dispatch-select" 
                  value={dispatchSettings.vehicle_id}
                  disabled
                >
                  <option value={selectedRoute.vehicle_id}>{selectedRoute.vehicle_id}</option>
                </select>
              </div>

              <button 
                className="btn-dispatch-large" 
                onClick={handleDispatch}
                disabled={isDispatching || selectedRoute.status === 'in_progress'}
              >
                <i className="fas fa-paper-plane"></i> 
                {isDispatching ? 'DISPATCHING...' : selectedRoute.status === 'in_progress' ? 'ALREADY IN TRANSIT' : 'DISPATCH NEW ROUTE'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Map */}
        <div className="dispatch-map-area">
          <MapContainer 
            center={DANANG_CENTER} 
            zoom={13} 
            style={{ width: "100%", height: "100%", zIndex: 1, borderRadius: "16px" }}
            zoomControl={false}
          >
            <TileLayer url={mapUrl} />
            <MapUpdater path={selectedRoute?.path} />
            
            {selectedRoute && selectedRoute.path && selectedRoute.path.length > 0 && (
              <>
                {/* Draw the Route Line */}
                <Polyline 
                  positions={routeGeometry.length > 0 ? routeGeometry : selectedRoute.path} 
                  color="#10B981" 
                  weight={5} 
                  opacity={0.8} 
                  className="animated-path"
                />

                {/* Draw the Bins on this Route */}
                {selectedRoute.path.map((pos, idx) => (
                  <Marker 
                    key={`bin-${idx}`} 
                    position={pos} 
                    icon={createFleetIcon('bin')} 
                  />
                ))}

                {/* The Animated Truck */}
                {(selectedRoute.status === 'in_progress' || isDispatching) && selectedRoute.path[truckPosIndex] && (
                  <Marker 
                    position={selectedRoute.path[truckPosIndex]} 
                    icon={createFleetIcon('vehicle')} 
                  >
                    <Popup>
                      <div style={{textAlign: 'center'}}>
                        <b>{selectedRoute.vehicle_id}</b><br/>
                        Driver: {selectedRoute.driver_name}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
