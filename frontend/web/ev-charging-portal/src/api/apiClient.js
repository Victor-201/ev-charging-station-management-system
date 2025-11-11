// src/api/apiClient.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_GATEWAY_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE,
  withCredentials: true, // only if you need cookies
  headers: {
    Accept: "application/json",
    // Do NOT force Content-Type here globally, let request-specific logic set it.
  },
});

// Attach token if present (use same key your AuthProvider uses)
apiClient.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};
    const token = localStorage.getItem("access_token") || null;
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // If sending FormData, allow browser to set Content-Type including boundary
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers["Content-Type"]) delete config.headers["Content-Type"];
    } else if (config.data !== undefined && config.data !== null && typeof config.data !== "string") {
      // for object payloads, set JSON content-type
      config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
    }

    // debug log (remove in production)
    // console.debug("[apiClient] ->", config.method?.toUpperCase(), config.url, { payloadType: typeof config.data, payload: config.data });

    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor: try to refresh token on 401 and retry (basic example)
apiClient.interceptors.response.use(
  (response) => response, // return full response to keep callers consistent
  async (error) => {
    const originalRequest = error?.config;

    // If 401 and not retried yet -> try refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        // Adjust URL to your refresh endpoint
        const refreshRes = await axios.post(`${BASE}/api/v1/auth/refresh-token`, { refresh_token: refreshToken });

        const newAccess = refreshRes?.data?.access_token ?? refreshRes?.data?.accessToken ?? refreshRes?.data?.token;
        const newRefresh = refreshRes?.data?.refresh_token ?? refreshRes?.data?.refreshToken ?? null;

        if (newAccess) {
          localStorage.setItem("access_token", newAccess);
          if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
          // update header and retry original
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        }
      } catch (e) {
        // refresh failed -> clear and redirect to login (or let app decide)
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // optional: window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
