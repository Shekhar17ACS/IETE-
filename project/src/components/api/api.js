import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create Axios instance
const api = axios.create({

  baseURL: API_BASE_URL || "http://127.0.0.1:8000/api/v1/",
  
  withCredentials: true, 
});

api.interceptors.request.use(
  config => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 🔄 Response Interceptor — refresh access token on 401 error
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = sessionStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token found");

        // Call the refresh token endpoint
        const response = await axios.post(
          
          `${API_BASE_URL}token/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        const newAccessToken = response.data.access;

        // Store the new access token
        sessionStorage.setItem("token", newAccessToken);

        // Update Authorization header and retry the request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {

        // Clear tokens and redirect to login
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;



