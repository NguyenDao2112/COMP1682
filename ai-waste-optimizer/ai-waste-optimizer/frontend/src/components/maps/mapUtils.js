import L from "leaflet";

/**
 * Configure Leaflet default icons for proper display
 */
export const setupLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

/**
 * Create marker icon based on fill level
 * @param {number} fillLevel - Bin fill level (0-100)
 * @returns {L.DivIcon} Leaflet DivIcon
 */
export const getBinMarkerIcon = (fillLevel) => {
  let color = "#10b981";
  if (fillLevel >= 80) color = "#ef4444";
  else if (fillLevel >= 60) color = "#f59e0b";
  
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;"><i class="fas fa-trash" style="color: white; font-size: 14px;"></i></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

/**
 * Create custom icon for fleet map markers
 * @param {string} type - Icon type (depot, bin, vehicle, vehicleIdle, start, end)
 * @param {string} color - Icon color
 * @param {boolean} isCompleted - Is the task completed
 * @returns {L.DivIcon} Leaflet DivIcon
 */
export const createFleetIcon = (type, color = "#3b82f6", isCompleted = false) => {
  const icons = {
    depot: `<div style="background: linear-gradient(135deg, #6366f1, #818cf8); width: 48px; height: 48px; border-radius: 50%; border: 4px solid white; box-shadow: 0 6px 20px rgba(99,102,241,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;"><i class="fas fa-warehouse" style="color: white; font-size: 20px;"></i></div>`,
    depotSmall: `<div style="background: linear-gradient(135deg, #6366f1, #818cf8); width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(99,102,241,0.4); display: flex; align-items: center; justify-content: center;"><i class="fas fa-warehouse" style="color: white; font-size: 14px;"></i></div>`,
    bin: `<div style="background: linear-gradient(135deg, ${color}, ${color}dd); width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><i class="fas fa-trash" style="color: white; font-size: 16px;"></i></div>`,
    binSmall: `<div style="background: linear-gradient(135deg, ${color}, ${color}dd); width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;"><i class="fas fa-trash" style="color: white; font-size: 12px;"></i></div>`,
    vehicle: `<div style="background: linear-gradient(135deg, #10b981, #34d399); width: 56px; height: 56px; border-radius: 50%; border: 4px solid white; box-shadow: 0 8px 25px rgba(16,185,129,0.6); display: flex; align-items: center; justify-content: center; animation: vehiclePulse 2s ease-in-out infinite; z-index: 2000;"><i class="fas fa-truck" style="color: white; font-size: 22px;"></i></div>`,
    vehicleIdle: `<div style="background: linear-gradient(135deg, #f59e0b, #fbbf24); width: 48px; height: 48px; border-radius: 50%; border: 3px solid white; box-shadow: 0 6px 20px rgba(245,158,11,0.5); display: flex; align-items: center; justify-content: center;"><i class="fas fa-truck" style="color: white; font-size: 18px;"></i></div>`,
    vehicleCompleted: `<div style="background: linear-gradient(135deg, #64748b, #94a3b8); width: 48px; height: 48px; border-radius: 50%; border: 3px solid white; box-shadow: 0 6px 20px rgba(100,116,139,0.5); display: flex; align-items: center; justify-content: center;"><i class="fas fa-check-circle" style="color: white; font-size: 20px;"></i></div>`,
    vehicleMaintenance: `<div style="background: linear-gradient(135deg, #ef4444, #f87171); width: 48px; height: 48px; border-radius: 50%; border: 3px solid white; box-shadow: 0 6px 20px rgba(239,68,68,0.5); display: flex; align-items: center; justify-content: center;"><i class="fas fa-wrench" style="color: white; font-size: 18px;"></i></div>`,
    start: `<div style="background: linear-gradient(135deg, #3b82f6, #60a5fa); width: 44px; height: 44px; border-radius: 50%; border: 4px solid white; box-shadow: 0 6px 20px rgba(59,130,246,0.5); display: flex; align-items: center; justify-content: center; z-index: 1500;"><i class="fas fa-play" style="color: white; font-size: 16px;"></i></div>`,
    end: `<div style="background: linear-gradient(135deg, #ef4444, #f87171); width: 44px; height: 44px; border-radius: 50%; border: 4px solid white; box-shadow: 0 6px 20px rgba(239,68,68,0.5); display: flex; align-items: center; justify-content: center; z-index: 1500;"><i class="fas fa-flag-checkered" style="color: white; font-size: 16px;"></i></div>`,
  };
  
  const sizes = { 
    depot: [48, 48], depotSmall: [36, 36], 
    bin: [40, 40], binSmall: [32, 32], 
    vehicle: [56, 56], vehicleIdle: [48, 48], vehicleCompleted: [48, 48],
    start: [44, 44], end: [44, 44] 
  };
  
  const anchors = { 
    depot: [24, 24], depotSmall: [18, 18], 
    bin: [20, 20], binSmall: [16, 16], 
    vehicle: [28, 28], vehicleIdle: [24, 24], vehicleCompleted: [24, 24],
    start: [22, 22], end: [22, 22] 
  };
  
  return L.divIcon({
    html: icons[type] || icons.vehicle,
    iconSize: sizes[type] || sizes.vehicle,
    iconAnchor: anchors[type] || anchors.vehicle,
  });
};

// Da Nang center coordinates
export const DANANG_CENTER = [16.0544, 108.2022];

// Default zoom levels
export const ZOOM_LEVELS = {
  CITY: 12,
  DISTRICT: 14,
  STREET: 16,
};