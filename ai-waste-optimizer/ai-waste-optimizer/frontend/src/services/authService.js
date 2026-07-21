// services/authService.js - Authentication API service
import { getHeaders, API_URL } from "./config";

/**
 * Auth Service - Handle authentication API calls
 */
export const authService = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} User data with token
   */
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
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    return response.json();
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Created user data
   */
  register: async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Registration failed");
    }

    return response.json();
  },

  /**
   * Get current user information
   * @returns {Promise} Current user data
   */
  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to get user");
    }

    return response.json();
  },

  /**
   * Logout - Clear local storage
   */
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  /**
   * Get stored user role
   * @returns {string|null}
   */
  getUserRole: () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.role || null;
  },
};

export default authService;