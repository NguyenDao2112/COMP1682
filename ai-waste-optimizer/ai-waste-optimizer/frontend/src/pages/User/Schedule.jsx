import React, { useState, useEffect } from "react";
import { routesAPI } from "../../services/api";

function Schedule() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const data = await routesAPI.getAll();
        setRoutes(data);
        setError("");
      } catch (err) {
        setError("Failed to load schedule");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  // Map backend routes to schedule data dynamically
  const scheduleData = React.useMemo(() => {
    if (!routes || routes.length === 0) {
      return [
        { day: "Monday", date: "2025-01-06", areas: ["Hai Chau", "Thanh Khe"], time: "6:00 AM - 12:00 PM", status: "completed", vehicle_id: "TRK-001" },
        { day: "Tuesday", date: "2025-01-07", areas: ["Lien Chieu", "Ngu Hanh Son"], time: "6:00 AM - 12:00 PM", status: "completed", vehicle_id: "TRK-002" },
        { day: "Wednesday", date: "2025-01-08", areas: ["Cam Le", "Hoa Vang"], time: "6:00 AM - 12:00 PM", status: "in-progress", vehicle_id: "TRK-003" },
        { day: "Thursday", date: "2025-01-09", areas: ["Hai Chau", "Thanh Khe"], time: "6:00 AM - 12:00 PM", status: "scheduled", vehicle_id: "TRK-001" },
        { day: "Friday", date: "2025-01-10", areas: ["Lien Chieu", "Ngu Hanh Son"], time: "6:00 AM - 12:00 PM", status: "scheduled", vehicle_id: "TRK-004" },
        { day: "Saturday", date: "2025-01-11", areas: ["City Center"], time: "7:00 AM - 2:00 PM", status: "scheduled", vehicle_id: "TRK-002" },
        { day: "Sunday", date: "2025-01-12", areas: ["No Collection"], time: "-", status: "off", vehicle_id: "N/A" },
      ];
    }

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return routes.map(r => {
      const dateObj = new Date(r.scheduled_date);
      const dateStr = r.scheduled_date ? r.scheduled_date.split("T")[0] : "";
      
      let statusMapped = "scheduled";
      if (r.status === "completed") statusMapped = "completed";
      else if (r.status === "in_progress") statusMapped = "in-progress";

      return {
        day: daysOfWeek[dateObj.getDay()] || "Scheduled",
        date: dateStr,
        areas: [r.route_name || `Route ${r.route_id}`],
        time: r.estimated_time ? `Est. Duration: ${r.estimated_time} mins` : "6:00 AM - 12:00 PM",
        status: statusMapped,
        vehicle_id: r.vehicle_id || "TRK-001"
      };
    });
  }, [routes]);

  const weekRangeText = React.useMemo(() => {
    if (!scheduleData || scheduleData.length === 0) return "No Schedule Data";
    const dates = scheduleData
      .map(d => d.date)
      .filter(Boolean)
      .sort();
      
    if (dates.length === 0) return "Schedule Calendar";
    
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    
    if (dates.length === 1) return `Schedule for ${formatDate(dates[0])}`;
    return `Schedule from ${formatDate(dates[0])} to ${formatDate(dates[dates.length - 1])}`;
  }, [scheduleData]);

  // Set initial selection if not set
  useEffect(() => {
    if (scheduleData && scheduleData.length > 0) {
      const exists = scheduleData.some(d => d.date === selectedDate);
      if (!exists) {
        setSelectedDate(scheduleData[0].date);
      }
    }
  }, [scheduleData, selectedDate]);

  const getStatusBadge = (status) => {
    const badges = {
      completed: { class: "success", text: "Completed" },
      "in-progress": { class: "warning", text: "In Progress" },
      scheduled: { class: "info", text: "Scheduled" },
      off: { class: "secondary", text: "Day Off" }
    };
    return badges[status] || badges.scheduled;
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h1>Collection Schedule</h1>
        <p>View upcoming waste collection schedule</p>
      </div>

      {error && <div className="page-error">{error}</div>}

      {/* Calendar Navigation */}
      <div className="calendar-nav">
        <button className="btn-nav">
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="current-week">
          <h3>{weekRangeText}</h3>
        </div>
        <button className="btn-nav">
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* Schedule Grid */}
      <div className="schedule-grid">
        {scheduleData.map((day, index) => {
          const badge = getStatusBadge(day.status);
          const isToday = day.date === selectedDate;
          
          return (
            <div 
              key={index} 
              className={`schedule-card ${day.status} ${isToday ? "selected" : ""}`}
              onClick={() => setSelectedDate(day.date)}
            >
              <div className="day-header">
                <span className="day-name">{day.day}</span>
                <span className={`status-badge ${badge.class}`}>{badge.text}</span>
              </div>
              
              <div className="day-date">
                <i className="fas fa-calendar-alt"></i>
                {day.date}
              </div>
              
              <div className="day-areas">
                <i className="fas fa-map-marker-alt"></i>
                {day.areas.join(", ")}
              </div>
              
              <div className="day-time">
                <i className="fas fa-clock"></i>
                {day.time}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Schedule */}
      <div className="schedule-details">
        <h3>Schedule Details for {selectedDate}</h3>
        
        {scheduleData.filter(d => d.date === selectedDate).map((day, index) => (
          <div key={index} className="detail-card">
            <div className="detail-header">
              <h4>{day.day} - {day.date}</h4>
              <span className={`status-badge ${getStatusBadge(day.status).class}`}>
                {getStatusBadge(day.status).text}
              </span>
            </div>
            
            <div className="detail-content">
              <div className="detail-item">
                <i className="fas fa-map-marked-alt"></i>
                <div>
                  <label>Collection Areas</label>
                  <p>{day.areas.join(", ")}</p>
                </div>
              </div>
              
              <div className="detail-item">
                <i className="fas fa-clock"></i>
                <div>
                  <label>Working Hours</label>
                  <p>{day.time}</p>
                </div>
              </div>
              
              <div className="detail-item">
                <i className="fas fa-truck"></i>
                <div>
                  <label>Vehicles Assigned</label>
                  <p>{day.vehicle_id || "TRK-001"}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Info */}
      <div className="schedule-info">
        <div className="info-card">
          <i className="fas fa-info-circle"></i>
          <div>
            <h4>Note</h4>
            <p>Schedule may change due to weather conditions or holidays. Check back for updates.</p>
          </div>
        </div>
      </div>

      <style>{`
        .schedule-page {
          padding: 0;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 8px 0;
        }

        .page-header p {
          color: #666;
          margin: 0;
        }

        .page-error {
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid #f44336;
          color: #f44336;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .page-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: #666;
        }

        .page-loading .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #eee;
          border-top-color: #00E676;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .calendar-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 24px;
        }

        .btn-nav {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #ddd;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-nav:hover {
          border-color: #00E676;
          color: #00E676;
        }

        .current-week h3 {
          margin: 0;
          font-size: 18px;
        }

        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .schedule-card {
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .schedule-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .schedule-card.selected {
          border: 2px solid #00E676;
        }

        .schedule-card.completed {
          opacity: 0.7;
        }

        .schedule-card.off {
          opacity: 0.5;
          background: #f9f9f9;
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .day-name {
          font-weight: 600;
          font-size: 14px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }

        .status-badge.success {
          background: rgba(76, 175, 80, 0.1);
          color: #4caf50;
        }

        .status-badge.warning {
          background: rgba(255, 152, 0, 0.1);
          color: #ff9800;
        }

        .status-badge.info {
          background: rgba(33, 150, 243, 0.1);
          color: #2196f3;
        }

        .status-badge.secondary {
          background: rgba(158, 158, 158, 0.1);
          color: #9e9e9e;
        }

        .day-date {
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .day-areas {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .day-time {
          font-size: 12px;
          color: #999;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .schedule-details {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .schedule-details h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .detail-card {
          padding: 16px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .detail-header h4 {
          margin: 0;
        }

        .detail-content {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .detail-item {
          display: flex;
          gap: 12px;
        }

        .detail-item i {
          font-size: 20px;
          color: #00E676;
        }

        .detail-item label {
          font-size: 12px;
          color: #999;
          display: block;
        }

        .detail-item p {
          margin: 4px 0 0 0;
          font-weight: 500;
        }

        .schedule-info {
          margin-top: 24px;
        }

        .info-card {
          background: rgba(33, 150, 243, 0.1);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          gap: 12px;
        }

        .info-card i {
          font-size: 20px;
          color: #2196f3;
        }

        .info-card h4 {
          margin: 0 0 4px 0;
        }

        .info-card p {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        @media (max-width: 1024px) {
          .schedule-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 768px) {
          .schedule-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .detail-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Schedule;
