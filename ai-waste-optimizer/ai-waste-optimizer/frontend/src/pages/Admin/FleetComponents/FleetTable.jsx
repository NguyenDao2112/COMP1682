import React from "react";

function FleetTable({
  vehicles,
  selectedVehicle,
  statusFilter,
  districtFilter,
  onStatusFilterChange,
  onDistrictFilterChange,
  onTrack,
  onDispatch,
  onEdit,
  onDelete,
  routeData,
  darkMode = true,
}) {
  const getStatusColor = (s) =>
    s === "active"
      ? { bg: "rgba(16,185,129,0.15)", t: "#10b981", l: "On Route", i: "fa-route" }
      : s === "idle"
      ? { bg: "rgba(245,158,11,0.15)", t: "#f59e0b", l: "Available", i: "fa-pause-circle" }
      : { bg: "rgba(239,68,68,0.15)", t: "#ef4444", l: "Maintenance", i: "fa-wrench" };

  const getFuelColor = (l) => (l <= 20 ? "#ef4444" : l <= 50 ? "#f59e0b" : "#10b981");

  const icons = {
    Compactor: "com",
    "Garbage Truck": "gar",
    "Recycling Truck": "rec",
    "Container Truck": "con",
  };

  return (
    <div className="fleet-table-wrap">
      <div className="table-header">
        <div className="table-title">
          <i className="fas fa-list"></i>
          <h2>Fleet Vehicles</h2>
        </div>
        <div className="filter-row">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">On Route</option>
            <option value="idle">Available</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            className="filter-select"
            value={districtFilter}
            onChange={(e) => onDistrictFilterChange(e.target.value)}
          >
            <option value="all">All Districts</option>
            <option value="Hai Chau">Hai Chau</option>
            <option value="Thanh Khe">Thanh Khe</option>
            <option value="Lien Chieu">Lien Chieu</option>
            <option value="Son Tra">Son Tra</option>
            <option value="Ngu Hanh Son">Ngu Hanh Son</option>
          </select>
        </div>
      </div>

      <div className="table-scroll">
        <table className="fleet-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Fuel</th>
              <th>Status</th>
              <th>Route</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v, i) => {
              const s = getStatusColor(v.status);
              const r = v.assigned_route ? routeData[v.assigned_route] : null;
              return (
                <tr
                  key={v.id}
                  className={selectedVehicle?.id === v.id ? "selected" : ""}
                  style={{ animationDelay: `${0.03 * i}s` }}
                  onClick={() => onTrack(v)}
                >
                  <td>
                    <div className="vehicle-cell">
                      <div className={`vehicle-icon ${icons[v.type] || "com"}`}>
                        <i className="fas fa-truck"></i>
                      </div>
                      <div>
                        <div className="vehicle-id">{v.vehicle_id}</div>
                        <div className="vehicle-type">{v.type}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="fuel-cell">
                      <div className="fuel-bar">
                        <div
                          className="fuel-fill"
                          style={{ width: `${v.fuel}%`, background: getFuelColor(v.fuel) }}
                        ></div>
                      </div>
                      <span className="fuel-text" style={{ color: getFuelColor(v.fuel) }}>
                        {v.fuel}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge" style={{ background: s.bg, color: s.t }}>
                      <i className={`fas ${s.i}`}></i>
                      {s.l}
                    </span>
                  </td>
                  <td className="route-cell">
                    {v.assigned_route ? (
                      <div>
                        <span className="route-name" style={{ color: r?.color }}>
                          {v.assigned_route}
                        </span>
                        <div className="route-progress">
                          <div className="progress-bar-mini" style={{ height: 4 }}>
                            <div
                              className="progress-fill-mini"
                              style={{ width: `${v.route_progress}%`, background: r?.color }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: darkMode ? "#64748b" : "#9ca3af", fontSize: 10 }}>
                        —
                      </span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="actions-cell">
                      <button
                        className="action-btn track"
                        title="Track"
                        onClick={() => onTrack(v)}
                      >
                        <i className="fas fa-map-marker-alt"></i>
                      </button>
                      {v.assigned_route ? (
                        <button
                          className="action-btn complete"
                          title="Complete"
                          onClick={() => onDispatch(v, true)}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      ) : (
                        <button
                          className="action-btn dispatch"
                          title="Dispatch"
                          onClick={() => onDispatch(v, false)}
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      )}
                      <button
                        className="action-btn edit"
                        title="Edit"
                        onClick={() => onEdit(v)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="action-btn delete"
                        title="Delete"
                        onClick={() => onDelete(v)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FleetTable;
