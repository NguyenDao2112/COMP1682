// services/api.js - API service for frontend
import { API_URL, getToken, getHeaders } from "./config";

// Auth API
export const healthAPI = {
  getTelemetry: async () => {
    const response = await fetch(`${API_URL}/api/health`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch telemetry");
    return response.json();
  }
};

export const configAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/api/config`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch config");
    return response.json();
  },
  update: async (data) => {
    const response = await fetch(`${API_URL}/api/config`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update config");
    return response.json();
  },
  createBackup: async (customName = null) => {
    const url = customName ? `${API_URL}/api/config/backup?custom_name=${encodeURIComponent(customName)}` : `${API_URL}/api/config/backup`;
    console.log("🔵 [createBackup] Calling:", url);
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
    });
    console.log("🔵 [createBackup] Response status:", response.status);
    if (!response.ok) {
      const errText = await response.text();
      console.error("🔴 [createBackup] Error body:", errText);
      throw new Error(`Failed to create DB backup snapshot: ${response.status} ${errText}`);
    }
    const data = await response.json();
    console.log("✅ [createBackup] Success:", data);
    return data;
  }
};

export const authAPI = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || "Login failed");
    }

    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(error.detail || "Registration failed");
    }

    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to get user" }));
      throw new Error(error.detail || "Failed to get user");
    }

    return response.json();
  },
};

// Bins API
export const binsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/bins?${queryString}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bins");
    }

    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/bins/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bin");
    }

    return response.json();
  },

  create: async (binData) => {
    const response = await fetch(`${API_URL}/api/bins`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(binData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create bin");
    }

    return response.json();
  },

  update: async (id, binData) => {
    const response = await fetch(`${API_URL}/api/bins/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(binData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update bin");
    }

    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/bins/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete bin");
    }

    return true;
  },

  getForMap: async () => {
    const response = await fetch(`${API_URL}/api/bins/map/all`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch bins for map");
    }

    return response.json();
  },

  getDashboardStats: async () => {
    const response = await fetch(`${API_URL}/api/bins/stats/dashboard`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }

    return response.json();
  },
};

// Routes API
export const routesAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/routes?${queryString}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch routes");
    }

    const data = await response.json();
    
    // Removed fake path generation - we now rely on real backend coordinates from CollectionHistory

    return data;
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/routes/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch route");
    }

    return response.json();
  },

  create: async (routeData) => {
    const response = await fetch(`${API_URL}/api/routes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create route");
    }

    return response.json();
  },

  update: async (id, routeData) => {
    const response = await fetch(`${API_URL}/api/routes/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(routeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update route");
    }

    return response.json();
  },

  swapTrucks: async (routeId1, routeId2) => {
    const response = await fetch(`${API_URL}/api/routes/swap-trucks`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ route_id_1: routeId1, route_id_2: routeId2 }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to swap trucks");
    }

    return response.json();
  },

  provisionDriverRoute: async () => {
    const response = await fetch(`${API_URL}/api/fleet/provision-request`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to provision driver and route");
    }

    return response.json();
  },

  start: async (id) => {
    const response = await fetch(`${API_URL}/api/routes/${id}/start`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to start route");
    }

    return response.json();
  },

  optimize: async () => {
    const response = await fetch(`${API_URL}/api/routes/optimize`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to optimize routes");
    }

    return response.json();
  },

  assignRoute: async (driverId) => {
    const response = await fetch(`${API_URL}/api/routes/${driverId}/assign`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to assign route");
    }

    return response.json();
  },


  complete: async (id) => {
    const response = await fetch(`${API_URL}/api/routes/${id}/complete`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to complete route");
    }

    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/routes/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to delete route");
    }

    if (response.status === 204) return null;
    return response.json();
  },
};

// Feedback API
export const feedbackAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/feedback?${queryString}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch feedbacks");
    }

    return response.json();
  },

  create: async (feedbackData) => {
    const response = await fetch(`${API_URL}/api/feedback`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create feedback");
    }

    return response.json();
  },

  update: async (id, feedbackData) => {
    const response = await fetch(`${API_URL}/api/feedback/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update feedback");
    }

    return response.json();
  },
};

// Reports API (Citizen reports - unified view for User and Admin)
export const reportsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/feedback?${queryString}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch reports");
    return response.json();
  },
  getByUser: async (userId) => {
    const response = await fetch(`${API_URL}/api/feedback?user_id=${userId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch user reports");
    return response.json();
  },
  create: async (reportData) => {
    const response = await fetch(`${API_URL}/api/feedback`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(reportData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to create report");
    }
    return response.json();
  },
  updateStatus: async (id, status) => {
    const response = await fetch(`${API_URL}/api/feedback/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Failed to update report status");
    return response.json();
  },
  getStats: async () => {
    const response = await fetch(`${API_URL}/api/bins/stats/dashboard`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },
};

// Driver API
export const driverAPI = {
  login: async (driverId, password) => {
    const response = await fetch(`${API_URL}/api/driver/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driver_id: driverId, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || "Login failed");
    }

    return response.json();
  },

  getMe: async () => {
    const response = await fetch(`${API_URL}/api/driver/me`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to get driver profile");
    return response.json();
  },

  getRouteSequence: async () => {
    const response = await fetch(`${API_URL}/api/driver/route/sequence`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch route sequence");
    return response.json();
  },

  getRouteDetails: async (routeId) => {
    const response = await fetch(`${API_URL}/api/driver/route/${routeId}/details`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch route details");
    return response.json();
  },

  collectBin: async (binId) => {
    const response = await fetch(`${API_URL}/api/driver/bin/${binId}/collect`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to collect bin" }));
      throw new Error(error.detail || "Failed to collect bin");
    }
    return response.json();
  },

  completeRoute: async () => {
    const response = await fetch(`${API_URL}/api/driver/route/complete`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to complete route" }));
      throw new Error(error.detail || "Failed to complete route");
    }
    return response.json();
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/notifications?${queryString}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }

    return response.json();
  },

  getUnreadCount: async () => {
    const response = await fetch(`${API_URL}/api/notifications/count`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch unread count");
    }

    return response.json();
  },

  markAsRead: async (id) => {
    const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to mark as read");
    }

    return response.json();
  },

  markAllAsRead: async () => {
    const response = await fetch(`${API_URL}/api/notifications/read-all`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to mark all as read");
    }

    return response.json();
  },
};

// Vehicles API
export const vehiclesAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/fleet?${queryString}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch vehicles");
    }

    return response.json();
  },

  create: async (vehicleData) => {
    // Mock create - add to local storage
    const vehicles = JSON.parse(localStorage.getItem("vehicles") || "[]");
    const newVehicle = {
      id: vehicles.length + 1,
      ...vehicleData,
      vehicle_id: vehicleData.vehicle_id || `TRK-${String(vehicles.length + 1).padStart(3, '0')}`,
    };
    vehicles.push(newVehicle);
    localStorage.setItem("vehicles", JSON.stringify(vehicles));
    return newVehicle;
  },

  update: async (id, vehicleData) => {
    // Mock update
    const vehicles = JSON.parse(localStorage.getItem("vehicles") || "[]");
    const index = vehicles.findIndex(v => v.id === id);
    if (index !== -1) {
      vehicles[index] = { ...vehicles[index], ...vehicleData };
      localStorage.setItem("vehicles", JSON.stringify(vehicles));
      return vehicles[index];
    }
    throw new Error("Vehicle not found");
  },

  delete: async (id) => {
    // Mock delete
    const vehicles = JSON.parse(localStorage.getItem("vehicles") || "[]");
    const filtered = vehicles.filter(v => v.id !== id);
    localStorage.setItem("vehicles", JSON.stringify(filtered));
    return true;
  },
};

// Users API (Admin only)
export const usersAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/api/users?${queryString}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    return response.json();
  },

  create: async (userData) => {
    const response = await fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create user");
    }

    return response.json();
  },

  update: async (id, userData) => {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update user");
    }

    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete user");
    }

    return true;
  },
};
