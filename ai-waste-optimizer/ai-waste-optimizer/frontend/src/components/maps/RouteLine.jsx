import { Polyline } from "react-leaflet";

/**
 * RouteLine - Component to display route path on map
 * @param {Array} routeCoords - Array of [lat, lng] coordinates
 * @param {string} color - Line color
 * @param {boolean} isActive - Is the route active
 * @param {number} weight - Line weight
 */
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

export default RouteLine;