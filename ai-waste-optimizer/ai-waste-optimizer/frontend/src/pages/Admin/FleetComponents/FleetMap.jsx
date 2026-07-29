import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createFleetIcon, DANANG_CENTER } from "../../../components/maps/mapUtils";
import MapController from "../../../components/maps/MapController";

function RouteLine({ routeCoords, color = "#3b82f6", isActive = true, weight = 7 }) {
  if (!routeCoords || routeCoords.length < 2) return null;
  return (
    <Polyline 
      positions={routeCoords} 
      color={color} 
      weight={weight} 
      opacity={isActive ? 0.95 : 0.6} 
      dashArray={isActive ? null : "15, 10"}
      lineCap="round"
      lineJoin="round"
    />
  );
}

function FleetMap({ 
  vehicles, 
  selectedVehicle, 
  mapCenter, 
  mapZoom, 
  viewMode, 
  activeRoute, 
  routeData, 
  vehiclePosition, 
  onTrack, 
  animateVehicle, 
  startRouteAnimation, 
  pauseAnimation, 
  completeRoute, 
  darkMode = true 
}) {
  const activeRouteData = activeRoute ? routeData[activeRoute] : null;

  return (
    <div className="fleet-map-wrap">
      <div className="map-header">
        <div className="map-title">
          <i className="fas fa-map-marked-alt"></i>
          <h2>Live Tracking Map</h2>
        </div>
        <div className="selected-info">
          {selectedVehicle && (
            <>
              <span className="selected-badge">{selectedVehicle.vehicle_id}</span>
              {selectedVehicle.assigned_route && (
                <>
                  <span className="route-badge">{selectedVehicle.assigned_route}</span>
                  <div className="progress-bar-mini">
                    <div className="progress-fill-mini" style={{ width: `${selectedVehicle.route_progress}%` }}></div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {selectedVehicle?.assigned_route && (
          <div className="map-controls">
            {!animateVehicle ? (
              <button className="map-btn play" onClick={startRouteAnimation} disabled={selectedVehicle.route_progress >= 100}>
                <i className="fas fa-play"></i> {selectedVehicle.route_progress > 0 ? "Resume" : "Start"}
              </button>
            ) : (
              <button className="map-btn pause" onClick={pauseAnimation}>
                <i className="fas fa-pause"></i> Pause
              </button>
            )}
            {selectedVehicle.route_progress >= 100 && (
              <button className="map-btn stop" onClick={() => completeRoute(selectedVehicle)}>
                <i className="fas fa-check-circle"></i> Complete
              </button>
            )}
          </div>
        )}
      </div>
      <div className="map-wrapper">
        <MapContainer center={mapCenter || DANANG_CENTER} zoom={mapZoom} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" subdomains={['a', 'b', 'c', 'd']} maxZoom={19} />
          <MapController center={mapCenter} zoom={mapZoom} />
          
          {viewMode === "all" && Object.entries(routeData).map(([name, rd]) => {
            const isActiveRoute = activeRoute === name;
            const isSelectedVehicleRoute = selectedVehicle?.assigned_route === name;
            const color = isActiveRoute || isSelectedVehicleRoute ? rd.color : "#94a3b8";
            return <RouteLine key={name} routeCoords={rd.path} color={color} isActive={isActiveRoute} />;
          })}
          
          {activeRouteData && (
            <>
              <Marker position={[activeRouteData.depot.lat, activeRouteData.depot.lng]} icon={createFleetIcon("depot")}>
                <Popup>
                  <div style={{ padding: 8, minWidth: 180 }}>
                    <b>🏭 {activeRouteData.depot.name}</b>
                    <br/>
                    <span style={{ fontSize: 11, color: "#666" }}>{activeRouteData.depot.address}</span>
                    <br/>
                    <span style={{ fontSize: 10, color: "#999" }}>Starting Point</span>
                  </div>
                </Popup>
              </Marker>
              
              {activeRouteData.bins.map((bin, idx) => {
                const isCompleted = selectedVehicle && selectedVehicle.current_bin > idx;
                return (
                  <Marker key={bin.id} position={[bin.lat, bin.lng]} icon={createFleetIcon("bin", isCompleted ? "#10b981" : "#f59e0b", isCompleted)}>
                    <Popup>
                      <div style={{ padding: 8, minWidth: 160 }}>
                        <b>🗑️ {bin.name}</b>
                        <br/>
                        <span style={{ fontSize: 11, color: "#666" }}>{bin.address}</span>
                        <br/>
                        <span style={{ fontSize: 10, color: isCompleted ? "#10b981" : "#f59e0b" }}>
                          {isCompleted ? "✓ Collected" : `Stop #${idx + 1}`}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </>
          )}
          
          {vehicles.map(v => {
            const pos = v.id === selectedVehicle?.id && vehiclePosition ? vehiclePosition : [v.lat, v.lng];
            const isActive = v.status === "active";
            return (
              <Marker 
                key={v.id} 
                position={pos} 
                icon={isActive ? createFleetIcon("vehicle") : createFleetIcon("vehicleIdle")}
                eventHandlers={{ click: () => onTrack(v) }}
              >
                <Popup>
                  <div style={{ padding: 10, minWidth: 200, background: darkMode ? "#1e293b" : "white", borderRadius: 12 }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: darkMode ? "white" : "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: isActive ? "#10b981" : v.status === "idle" ? "#f59e0b" : "#ef4444" }}></span>
                      {v.vehicle_id}
                    </h4>
                    <p style={{ margin: "5px 0", fontSize: 11, color: darkMode ? "#94a3b8" : "#6b7280" }}><b>Driver:</b> {v.driver_name}</p>
                    <p style={{ margin: "5px 0", fontSize: 11, color: darkMode ? "#94a3b8" : "#6b7280" }}><b>Type:</b> {v.type}</p>
                    <p style={{ margin: "5px 0", fontSize: 11, color: darkMode ? "#94a3b8" : "#6b7280" }}><b>Fuel:</b> {v.fuel}%</p>
                    {v.assigned_route && (
                      <>
                        <p style={{ margin: "5px 0", fontSize: 11, color: darkMode ? "#94a3b8" : "#6b7280" }}><b>Route:</b> {v.assigned_route}</p>
                        <p style={{ margin: "5px 0", fontSize: 11, color: darkMode ? "#94a3b8" : "#6b7280" }}><b>Progress:</b> {v.route_progress}%</p>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

export default FleetMap;