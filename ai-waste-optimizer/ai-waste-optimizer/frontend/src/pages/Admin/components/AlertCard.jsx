/**
 * AlertCard - Reusable Alert component
 * @param {Object} alert - Alert data object
 * @param {Function} onClick - Click handler
 */
function AlertCard({ alert, onClick = null }) {
  const typeStyles = {
    overflow: {
      borderColor: "#ef4444",
      iconBg: "rgba(239, 68, 68, 0.2)",
      iconColor: "#ef4444",
    },
    warning: {
      borderColor: "#f59e0b",
      iconBg: "rgba(245, 158, 11, 0.2)",
      iconColor: "#f59e0b",
    },
    report: {
      borderColor: "#3b82f6",
      iconBg: "rgba(59, 130, 246, 0.2)",
      iconColor: "#3b82f6",
    },
  };

  const style = typeStyles[alert.type] || typeStyles.warning;

  const cardStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "16px",
    borderRadius: "16px",
    marginBottom: "12px",
    transition: "all 0.3s",
    cursor: onClick ? "pointer" : "default",
    borderLeft: `4px solid ${style.borderColor}`,
    animation: "scaleIn 0.4s ease",
  };

  const iconStyle = {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    background: style.iconBg,
    color: style.iconColor,
  };

  const iconMap = {
    overflow: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    report: "fa-comment-dots",
  };

  return (
    <div 
      style={cardStyle}
      onClick={() => onClick && onClick(alert)}
      className="alert-card-wow"
    >
      <div style={iconStyle}>
        <i className={`fas ${iconMap[alert.type] || "fa-bell"}`}></i>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "15px", fontWeight: "600" }}>{alert.bin_id}</span>
          <span style={{ fontSize: "12px", opacity: 0.7 }}>{alert.time}</span>
        </div>
        <div style={{ fontSize: "12px", marginBottom: "8px", opacity: 0.8 }}>
          {alert.title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", opacity: 0.7 }}>{alert.district || alert.address}</span>
          <span style={{ 
            padding: "4px 10px", 
            borderRadius: "8px", 
            fontSize: "13px", 
            fontWeight: "600",
            background: "rgba(255,255,255,0.1)",
          }}>
            {alert.fill_level}%
          </span>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .alert-card-wow:hover {
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}

export default AlertCard;