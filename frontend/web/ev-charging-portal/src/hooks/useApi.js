import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth"; 

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth(); 

  const client = axios.create({
    baseURL: import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080",
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.request.use((config) => {
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  });

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    try {
      const res = await client({ method, url, data, ...config });
      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Something went wrong!";

      toast.error(msg);
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
