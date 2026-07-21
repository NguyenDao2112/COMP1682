import React, { useState, useEffect } from "react";

/**
 * DonutChart - Reusable donut chart component
 * @param {Array} data - Array of {label, value, color}
 * @param {Function} onSegmentClick - Callback when segment is clicked
 * @param {boolean} darkMode - Dark/Light mode
 * @param {number} size - Chart size (default 140)
 */
function DonutChart({ data, onSegmentClick, darkMode = true, size = 140 }) {
  const [animated, setAnimated] = useState(false);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    setTimeout(() => setAnimated(true), 100);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let currentAngle = 0;

  return (
    <div className="donut-chart-container">
      <svg viewBox="0 0 120 120" className="donut-svg" onClick={() => onSegmentClick && onSegmentClick(null)}>
        {data.map((item, index) => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;
          const startRad = (startAngle - 90) * Math.PI / 180;
          const endRad = (startAngle + angle - 90) * Math.PI / 180;
          const x1 = 60 + radius * Math.cos(startRad);
          const y1 = 60 + radius * Math.sin(startRad);
          const x2 = 60 + radius * Math.cos(endRad);
          const y2 = 60 + radius * Math.sin(endRad);
          const largeArc = angle > 180 ? 1 : 0;
          const dashArray = animated ? `${(angle / 360) * circumference} ${circumference}` : `0 ${circumference}`;
          
          return (
            <g key={index} onClick={(e) => { e.stopPropagation(); onSegmentClick && onSegmentClick(item.label); }} style={{ cursor: 'pointer' }}>
              <path 
                d={`M 60 60 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`} 
                fill={item.color} 
                stroke="white" 
                strokeWidth="2"
                className="donut-segment"
                style={{ 
                  transformOrigin: '60px 60px',
                  animation: animated ? `donutReveal 0.6s ease-out ${index * 0.15}s forwards` : 'none',
                  opacity: animated ? 1 : 0,
                  transform: animated ? 'scale(1)' : 'scale(0.8)'
                }}
              />
            </g>
          );
        })}
        <circle cx="60" cy="60" r={radius - 12} fill={darkMode ? "#1e293b" : "#ffffff"} />
      </svg>
      <div className="donut-center">
        <span className="donut-total">{total}</span>
        <span className="donut-label">Total</span>
      </div>
      <div className="donut-legend">
        {data.map((item, index) => (
          <div 
            key={index} 
            className="donut-legend-item" 
            onClick={() => onSegmentClick && onSegmentClick(item.label)}
            style={{ cursor: 'pointer' }}
          >
            <span className="donut-legend-dot" style={{ background: item.color }}></span>
            <span className="donut-legend-text">{item.label}</span>
            <span className="donut-legend-value">{item.value}</span>
            <span className="donut-legend-percent">{((item.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes donutReveal {
          from { opacity: 0; transform: scale(0.5) rotate(-90deg); }
          to { opacity: 1; transform: scale(1) rotate(0); }
        }
        .donut-chart-container { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .donut-svg { width: ${size}px; height: ${size}px; cursor: pointer; }
        .donut-segment { transition: all 0.3s ease; }
        .donut-segment:hover { filter: brightness(1.1); transform-origin: 60px 60px; }
        .donut-center { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; margin-top: -80px; }
        .donut-total { font-size: 28px; font-weight: 700; }
        .donut-label { font-size: 11px; opacity: 0.7; }
        .donut-legend { width: 100%; display: flex; flex-direction: column; gap: 8px; }
        .donut-legend-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 10px; transition: all 0.2s; }
        .donut-legend-item:hover { background: rgba(16, 185, 129, 0.1); }
        .donut-legend-dot { width: 12px; height: 12px; border-radius: 4px; }
        .donut-legend-text { flex: 1; font-size: 13px; font-weight: 500; }
        .donut-legend-value { font-size: 14px; font-weight: 700; }
        .donut-legend-percent { font-size: 12px; opacity: 0.7; width: 40px; text-align: right; }
      `}</style>
    </div>
  );
}

export default DonutChart;