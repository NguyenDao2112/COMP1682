import React from "react";

function FleetRouteDetails({ route, selectedVehicle, darkMode = true }) {
  if (!route || !selectedVehicle) return null;

  return (
    <div className="fleet-details">
      <div className="route-details-container">
        <div className="route-details-title">
          <i className="fas fa-route"></i> {route.name} - Route Details
        </div>
        <div className="route-info-grid">
          <div className="route-info-card">
            <div className="route-info-icon">📏</div>
            <div className="route-info-value">{activeRouteData.distance}</div>
            <div className="route-info-label">Kilometers</div>
          </div>
          <div className="route-info-card">
            <div className="route-info-icon">⏱️</div>
            <div className="route-info-value">{activeRouteData.time}</div>
            <div className="route-info-label">Minutes</div>
          </div>
          <div className="route-info-card">
            <div className="route-info-icon">🗑️</div>
            <div className="route-info-value">{activeRouteData.bins.length}</div>
            <div className="route-info-label">Stops</div>
          </div>
        </div>
        <div className="route-stops">
          <div className="stop-item">
            <div className="stop-icon depot">
              <i className="fas fa-warehouse"></i>
            </div>
            <div className="stop-info">
              <div className="stop-name">{activeRouteData.depot.name}</div>
              <div className="stop-address">{activeRouteData.depot.address}</div>
            </div>
            <span className="stop-status completed">START</span>
          </div>
          {activeRouteData.bins.map((bin, idx) => {
            const isCompleted = selectedVehicle.current_bin > idx;
            return (
              <div key={bin.id} className="stop-item">
                <div
                  className={`stop-icon ${isCompleted ? "bin-completed" : "bin-pending"}`}
                >
                  <i className={`fas ${isCompleted ? "fa-check" : "fa-trash"}`}></i>
                </div>
                <div className="stop-info">
                  <div className="stop-name">{bin.name}</div>
                  <div className="stop-address">{bin.address}</div>
                </div>
                <span className={`stop-status ${isCompleted ? "completed" : "pending"}`}>
                  {isCompleted ? "✓ Done" : `Stop ${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FleetRouteDetails;
