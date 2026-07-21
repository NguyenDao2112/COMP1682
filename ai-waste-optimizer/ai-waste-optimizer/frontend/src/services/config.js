/**
 * API Configuration - Single source of truth for API connection
 */

export const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * Get authentication token from localStorage
 * @returns {string|null}
 */
export const getToken = () => localStorage.getItem("token");

/**
 * Get headers with authentication token
 * @returns {Object} Headers object
 */
export const getHeaders = () => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Build query string from params object
 * @param {Object} params - Query parameters
 * @returns {string} Query string
 */
export const buildQueryString = (params = {}) => {
  return new URLSearchParams(params).toString();
};

/**
 * Classify error type for user-friendly messages
 * @param {Error} error - The caught error
 * @returns {{ message: string, isNetworkError: boolean }}
 */
export const classifyError = (error) => {
  if (error.name === "TypeError" && error.message === "Failed to fetch") {
    return {
      message: "Cannot connect to the server. Please check your internet connection or try again later.",
      isNetworkError: true,
    };
  }
  if (error.name === "AbortError") {
    return {
      message: "Request timed out. Please try again.",
      isNetworkError: true,
    };
  }
  return {
    message: error.message || "An unexpected error occurred. Please try again.",
    isNetworkError: false,
  };
};

/**
 * Make API request with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const err = new Error(error.detail || error.message || "API request failed");
      err.status = response.status;
      throw err;
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

export default { getToken, getHeaders, buildQueryString, apiRequest, classifyError, API_URL };
