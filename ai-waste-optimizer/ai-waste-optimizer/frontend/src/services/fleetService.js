// services/fleetService.js - Fleet/Vehicle API service
import { getHeaders, buildQueryString, API_URL } from "./config";

/**
 * Fleet Service - Handle fleet/vehicle API calls
 */
export const fleetService = {
  /**
   * Get all vehicles
   * @param {Object} params - Query parameters
   * @returns {Promise} Array of vehicles
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_URL}/api/fleet?${queryString}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch vehicles");
    }

    return response.json();
  },

  /**
   * Get vehicle by ID
   * @param {number} id - Vehicle ID
   * @returns {Promise} Vehicle data
   */
  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/fleet/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch vehicle");
    }

    return response.json();
  },

  /**
   * Create new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise} Created vehicle
   */
  create: async (vehicleData) => {
    const response = await fetch(`${API_URL}/api/fleet`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create vehicle");
    }

    return response.json();
  },

  /**
   * Update vehicle
   * @param {number} id - Vehicle ID
   * @param {Object} vehicleData - Updated vehicle data
   * @returns {Promise} Updated vehicle
   */
  update: async (id, vehicleData) => {
    const response = await fetch(`${API_URL}/api/fleet/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update vehicle");
    }

    return response.json();
  },

  /**
   * Delete vehicle
   * @param {number} id - Vehicle ID
   * @returns {Promise} Success
   */
  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/fleet/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete vehicle");
    }

    return true;
  },

  /**
   * Get sample/mock vehicles (for demo purposes)
   * @returns {Array} Sample vehicles
   */
  getSampleVehicles: () => [
    { id: 1, vehicle_id: "TRK-001", type: "Compactor", capacity: 8000, status: "active", driver_name: "Nguyen Van A", location: "Hai Chau Depot", fuel: 85, lat: 16.0544, lng: 108.2022, assigned_route: "Route A1", route_progress: 0, current_bin: 0 },
    { id: 2, vehicle_id: "TRK-002", type: "Garbage Truck", capacity: 5000, status: "active", driver_name: "Tran Van B", location: "Thanh Khe Depot", fuel: 45, lat: 16.0700, lng: 108.2200, assigned_route: "Route B2", route_progress: 50, current_bin: 2 },
    { id: 3, vehicle_id: "TRK-003", type: "Recycling Truck", capacity: 3000, status: "idle", driver_name: "Le Van C", location: "Lien Chieu Depot", fuel: 90, lat: 16.0800, lng: 108.2300, assigned_route: null, route_progress: 0, current_bin: 0 },
    { id: 4, vehicle_id: "TRK-004", type: "Container Truck", capacity: 12000, status: "active", driver_name: "Pham Van D", location: "Son Tra Depot", fuel: 15, lat: 16.0400, lng: 108.1900, assigned_route: "Route D1", route_progress: 75, current_bin: 2 },
    { id: 5, vehicle_id: "TRK-005", type: "Compactor", capacity: 8000, status: "maintenance", driver_name: "Hoang Van E", location: "Ngu Hanh Son Depot", fuel: 30, lat: 16.0900, lng: 108.2400, assigned_route: null, route_progress: 0, current_bin: 0 },
    { id: 6, vehicle_id: "TRK-006", type: "Garbage Truck", capacity: 5000, status: "idle", driver_name: "Vo Van F", location: "Hai Chau Depot", fuel: 75, lat: 16.0600, lng: 108.2050, assigned_route: null, route_progress: 0, current_bin: 0 },
  ],
};

export default fleetService;