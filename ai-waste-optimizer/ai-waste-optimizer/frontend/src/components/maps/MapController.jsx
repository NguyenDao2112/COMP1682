import { useMap } from "react-leaflet";
import { useEffect } from "react";

/**
 * MapController - Component to control map center and zoom programmatically
 * @param {Array} center - [lat, lng] coordinates
 * @param {number} zoom - Zoom level
 * @param {number} duration - Animation duration in seconds
 */
function MapController({ center, zoom = 15, duration = 1.5 }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration });
    }
  }, [center, zoom, duration, map]);
  
  return null;
}

export default MapController;