import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { driverAPI } from "../../services/api";
import "./Driver.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function RouteView() {
  const navigate = useNavigate();
  const [routeData, setRouteData] = useState(null);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStop, setCurrentStop] = useState(0);
  const [completedStops, setCompletedStops] = useState([]);
  const [isOfflineMode, setIsOfflineMode] = useState(localStorage.getItem("offlineMode") === "true");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token || user.role !== "driver") {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchBins = async () => {
      try {
        setLoading(true);
        const data = await driverAPI.getRouteSequence();
        setRouteData(data);
        
        const mappedBins = (data.route || []).map((bin, idx) => ({
          id: bin.id || `BIN_${idx + 1}`,
          bin_id: bin.id || `BIN_${idx + 1}`,
          address: bin.location_name,
          latitude: bin.latitude,
          longitude: bin.longitude,
          current_fill_level: bin.current_fill_level,
          bin_type: bin.bin_type,
          zone: bin.zone,
          collection_status: bin.collection_status || "pending",
        }));
        setBins(mappedBins);

        // Initialize completed stops from backend sequence
        const completed = mappedBins
          .filter(b => b.collection_status === "completed")
          .map(b => b.id);
        setCompletedStops(completed);

        // Set current stop to first uncompleted stop
        const firstPendingIdx = mappedBins.findIndex(b => b.collection_status === "pending");
        if (firstPendingIdx !== -1) {
          setCurrentStop(firstPendingIdx);
        } else {
          setCurrentStop(mappedBins.length - 1);
        }
      } catch (err) {
        console.error("[RouteView] fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!isOfflineMode) {
      fetchBins();
    } else {
      // Load strictly from offline storage if mode is ON
      const offlineRoute = JSON.parse(localStorage.getItem("offlineRouteData"));
      const offlineBins = JSON.parse(localStorage.getItem("offlineBinsData"));
      const offlineCompleted = JSON.parse(localStorage.getItem("offlineCompletedStops") || "[]");
      if (offlineRoute && offlineBins) {
        setRouteData(offlineRoute);
        setBins(offlineBins);
        setCompletedStops(offlineCompleted);
        
        // Find current stop
        const firstPendingIdx = offlineBins.findIndex(b => b.collection_status === "pending");
        setCurrentStop(firstPendingIdx !== -1 ? firstPendingIdx : offlineBins.length - 1);
        
        setLoading(false);
      } else {
        // Fallback if no offline data exists
        fetchBins();
      }
    }
  }, [isOfflineMode]);

  const toggleOfflineMode = () => {
    const newMode = !isOfflineMode;
    setIsOfflineMode(newMode);
    localStorage.setItem("offlineMode", newMode);
    
    if (newMode) {
      // Save data for offline use
      if (routeData && bins.length > 0) {
        localStorage.setItem("offlineRouteData", JSON.stringify(routeData));
        localStorage.setItem("offlineBinsData", JSON.stringify(bins));
        localStorage.setItem("offlineCompletedStops", JSON.stringify(completedStops));
      }
      alert("Đã tải bản đồ và lộ trình để sử dụng Offline (Không cần 4G/Wifi)!");
    } else {
      // Clear offline data when turning off, except if we want to sync it later
      // For now, let's keep it until they complete the route.
    }
  };

  const handleMarkCollected = async (binId) => {
    try {
      if (!isOfflineMode) {
        // Only call API if we are online
        await driverAPI.collectBin(binId);
      }
      
      setCompletedStops(prev => {
        const next = [...prev, binId];
        if (isOfflineMode) localStorage.setItem("offlineCompletedStops", JSON.stringify(next));
        return next;
      });
      
      // Update local state for immediate feedback
      setBins(prevBins => {
        const nextBins = prevBins.map(b => b.id === binId ? { ...b, current_fill_level: 0, collection_status: "completed" } : b);
        if (isOfflineMode) localStorage.setItem("offlineBinsData", JSON.stringify(nextBins));
        return nextBins;
      });
      
      if (currentStop < bins.length - 1) {
        setCurrentStop(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to collect bin:", err);
      alert(err.message || "Failed to mark bin as collected");
    }
  };

  const handleCompleteRoute = async () => {
    try {
      if (!isOfflineMode) {
        await driverAPI.completeRoute();
      } else {
        alert("Đã hoàn thành chuyến đi ở chế độ Offline. Vui lòng tắt chế độ Offline khi có mạng để đồng bộ dữ liệu về máy chủ!");
      }
      navigate("/driver/dashboard");
    } catch (err) {
      console.error("Failed to complete route:", err);
      alert(err.message || "Failed to complete route");
    }
  };

  const routeCoordinates = bins.map(bin => [bin.latitude, bin.longitude]);

  if (loading) {
    return (
      <div className="driver-loading">
        <div className="spinner"></div>
        <p>Loading route...</p>
      </div>
    );
  }

  if (!bins.length) {
    return (
      <div className="driver-loading">
        <div className="spinner"></div>
        <p>No route assigned. Please contact your manager.</p>
      </div>
    );
  }

  return (
    <div className="route-view">
      <div className="route-map">
        <MapContainer 
          center={[bins[0].latitude, bins[0].longitude]} 
          zoom={14} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {routeCoordinates.length > 1 && (
            <Polyline 
              positions={routeCoordinates}
              color="#2E7D32"
              weight={4}
              opacity={0.8}
            />
          )}
          
          {bins.map((bin, index) => (
            <Marker 
              key={bin.id}
              position={[bin.latitude, bin.longitude]}
            >
              <Popup>
                <div style={{ minWidth: "120px" }}>
                  <h4>Stop #{index + 1}</h4>
                  <p>Bin ID: {bin.id}</p>
                  <p>Fill: {bin.current_fill_level}%</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="route-stops">
        <div className="route-stops-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Collection Stops</h2>
            <p>{completedStops.length} of {bins.length} completed</p>
          </div>
          
          {/* Offline Mode Toggle Switch */}
          <div className="offline-toggle-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: isOfflineMode ? '#22C55E' : 'gray', fontWeight: 'bold' }}>
              <i className={`fas ${isOfflineMode ? 'fa-wifi-slash' : 'fa-wifi'}`}></i> Offline
            </span>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
              <input 
                type="checkbox" 
                checked={isOfflineMode} 
                onChange={toggleOfflineMode}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="slider round" style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: isOfflineMode ? '#22C55E' : '#ccc', borderRadius: '34px',
                transition: '.4s'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '16px', width: '16px', left: '3px', bottom: '3px',
                  backgroundColor: 'white', borderRadius: '50%', transition: '.4s',
                  transform: isOfflineMode ? 'translateX(18px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>
        </div>
        
        <div className="stops-list">
          {bins.map((bin, index) => (
            <div 
              key={bin.id} 
              className={`stop-item ${completedStops.includes(bin.id) ? 'completed' : ''}`}
              onClick={() => setCurrentStop(index)}
            >
              <div className="stop-number">
                {completedStops.includes(bin.id) ? (
                  <i className="fas fa-check"></i>
                ) : (
                  index + 1
                )}
              </div>
              <div className="stop-info">
                <h4>Bin #{bin.bin_id}</h4>
                <p>{bin.address || "Address TBD"}</p>
                <p>Fill Level: {bin.current_fill_level}%</p>
              </div>
              {!completedStops.includes(bin.id) && (
                <button 
                  className="btn-collect"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkCollected(bin.id);
                  }}
                >
                  Mark Collected
                </button>
              )}
            </div>
          ))}
        </div>

        {completedStops.length === bins.length && (
          <div style={{ padding: "var(--spacing-lg)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button 
              className="btn-start" 
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleCompleteRoute}
            >
              <i className="fas fa-check-circle"></i> Complete Route
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RouteView;
