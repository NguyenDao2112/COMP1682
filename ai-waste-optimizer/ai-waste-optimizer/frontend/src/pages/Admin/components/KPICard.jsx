/**
 * KPICard - Reusable KPI Card component
 * @param {string} title - Card title
 * @param {number|string} value - KPI value
 * @param {string} icon - FontAwesome icon class
 * @param {string} color - Color theme (green, purple, orange, blue)
 * @param {string} trend - Trend indicator (up, down, neutral)
 * @param {Function} onClick - Click handler
 * @param {number} delay - Animation delay in seconds
 */
function KPICard({ 
  title, 
  value, 
  icon = "fa-chart-line", 
  color = "green", 
  trend = null,
  onClick = null,
  delay = 0 
}) {
  const colorClasses = {
    green: {
      gradient: "linear-gradient(135deg, #10b981, #34d399)",
      icon: "linear-gradient(135deg, #10b981, #34d399)",
    },
    purple: {
      gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
      icon: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
    },
    orange: {
      gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
      icon: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    },
    blue: {
      gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
      icon: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    },
  };

  const styles = {
    card: {
      borderRadius: "20px",
      padding: "20px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.3s",
      animation: `fadeUp 0.6s ease forwards`,
      animationDelay: `${delay}s`,
      opacity: 0,
    },
    iconWrapper: {
      width: "56px",
      height: "56px",
      borderRadius: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      color: "white",
    },
    content: {
      flex: 1,
    },
    value: {
      fontSize: "32px",
      fontWeight: "700",
    },
    label: {
      fontSize: "13px",
      opacity: 0.8,
    },
    trend: {
      fontSize: "12px",
      padding: "4px 10px",
      borderRadius: "20px",
      fontWeight: "600",
    },
  };

  return (
    <div 
      style={styles.card}
      onClick={onClick}
      className="kpi-card-wow"
    >
      <div 
        style={{ 
          ...styles.iconWrapper, 
          background: colorClasses[color]?.icon || colorClasses.green.icon 
        }}
      >
        <i className={`fas ${icon}`}></i>
      </div>
      <div style={styles.content}>
        <div style={{ ...styles.value }}>{value}</div>
        <div style={{ ...styles.label }}>{title}</div>
      </div>
      {trend && (
        <div 
          style={{ 
            ...styles.trend, 
            background: trend === "up" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
            color: trend === "up" ? "#10b981" : "#ef4444",
          }}
        >
          <i className={`fas fa-arrow-${trend}`}></i>
        </div>
      )}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .kpi-card-wow:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
}

export default KPICard;