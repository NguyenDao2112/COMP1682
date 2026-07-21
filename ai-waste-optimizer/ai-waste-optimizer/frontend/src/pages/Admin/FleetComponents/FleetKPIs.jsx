import React from "react";

function FleetKPIs({ vehicles, statusFilter, viewMode, onStatusFilterChange, onViewModeChange, darkMode = true }) {
  const stats = {
    total: vehicles.length,
    active: vehicles.filter((v) => v.status === "active").length,
    idle: vehicles.filter((v) => v.status === "idle").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
  };

  const kpiCards = [
    { key: "total", label: "Total Fleet", value: stats.total, icon: "fa-truck", iconClass: "total", filter: "all", viewMode: "all" },
    { key: "active", label: "On Route", value: stats.active, icon: "fa-route", iconClass: "active", filter: "active", viewMode: "active" },
    { key: "idle", label: "Available", value: stats.idle, icon: "fa-pause-circle", iconClass: "idle", filter: "idle", viewMode: "all" },
    { key: "maintenance", label: "Maintenance", value: stats.maintenance, icon: "fa-wrench", iconClass: "maint", filter: "maintenance", viewMode: "all" },
  ];

  const handleCardClick = (card) => {
    onStatusFilterChange(card.filter);
    if (card.viewMode) onViewModeChange(card.viewMode);
  };

  const isActiveFilter = (card) =>
    card.filter === "all" && viewMode === "all" && statusFilter === "all" ||
    statusFilter === card.filter;

  return (
    <div className="fleet-kpi-grid">
      {kpiCards.map((card, index) => (
        <div
          key={card.key}
          className={`fleet-kpi-card ${isActiveFilter(card) ? "active-filter" : ""}`}
          style={{ animationDelay: `${0.1 + index * 0.1}s` }}
          onClick={() => handleCardClick(card)}
        >
          <div className={`fleet-kpi-icon ${card.iconClass}`}>
            <i className={`fas ${card.icon}`}></i>
          </div>
          <div className="fleet-kpi-content">
            <h3>{card.value}</h3>
            <p>{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FleetKPIs;
