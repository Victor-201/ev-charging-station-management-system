import { useState, useEffect } from "react";
import jwtDecode from "jwt-decode";
import { AuthContext } from "@/contexts/AuthContext";

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, role: null, email: null });
  const [isLoading, setIsLoading] = useState(true);

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isTokenExpired(token)) {
      const decoded = jwtDecode(token);
      setAuth({
        token,
        email: decoded.email,
        role: decoded.role,
      });
    }
    setIsLoading(false);
  }, []);

  const login = (token) => {
    if (!token) return;
    const decoded = jwtDecode(token);
    localStorage.setItem("token", token);
    setAuth({
      token,
      email: decoded.email,
      role: decoded.role,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuth({ token: null, role: null, email: null });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
