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
    try {
      if (token && !isTokenExpired(token)) {
        const decoded = jwtDecode(token);
        setAuth({
          token,
          email: decoded.email,
          role: decoded.role,
        });
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (role = "staff") => {
    const payload = {
      email: `${role}@example.com`,
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const fakeToken = btoa(JSON.stringify(payload));
    localStorage.setItem("token", fakeToken);
    setAuth({
      token: fakeToken,
      email: payload.email,
      role: payload.role,
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
