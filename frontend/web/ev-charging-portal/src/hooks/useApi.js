// src/hooks/useApi.js
import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const authCtx = useAuth(); // full context
  // accept multiple token property names
  const token =
    authCtx?.accessToken ?? authCtx?.token ?? authCtx?.auth?.token ?? null;

  const client = axios.create({
    baseURL: import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000",
    headers: {
      Accept: "application/json",
    },
  });

  client.interceptors.request.use((config) => {
    config.headers = config.headers || {};

    // Attach token if available
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // If data is a string that looks like JSON, try to parse to object
    if (typeof config.data === "string") {
      const s = config.data.trim();
      // try parse only when it looks like JSON or double-stringified JSON
      if (s.startsWith("{") || s.startsWith("[") || s.startsWith('"')) {
        try {
          const parsed = JSON.parse(s);
          // If parse yields object/array, replace data (fix double-stringify)
          if (parsed && (typeof parsed === "object" || Array.isArray(parsed))) {
            console.warn("[useApi] auto-parsed request data string -> object");
            config.data = parsed;
          }
        } catch (e) {
          // not parseable → leave as-is (maybe intentional plain string)
        }
      }
    }

    // If sending FormData, delete Content-Type so browser sets boundary
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers["Content-Type"]) delete config.headers["Content-Type"];
    } else {
      // ensure JSON content-type when sending object
      if (config.data !== undefined && config.data !== null && typeof config.data !== "string") {
        config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
      }
    }

    // Debug: inspect what will be sent (remove for production)
    // eslint-disable-next-line no-console
    console.debug("[API REQUEST]", config.method?.toUpperCase(), config.url, {
      headers: config.headers,
      payloadType: typeof config.data,
      payload: config.data,
    });

    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => Promise.reject(err)
  );

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    try {
      const res = await client({ method, url, data, ...config });
      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong!";
      toast.error(msg);
      // eslint-disable-next-line no-console
      console.error("[API ERROR]", method, url, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    get: (url, config) => request("GET", url, null, config),
    post: (url, data, config) => request("POST", url, data, config),
    put: (url, data, config) => request("PUT", url, data, config),
    del: (url, config) => request("DELETE", url, null, config),
  };
};

export default useApi;
