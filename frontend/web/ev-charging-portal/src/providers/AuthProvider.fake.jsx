import { useState, useEffect } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, role: null, email: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = JSON.parse(atob(token));
      setAuth({
        token,
        email: decoded.email,
        role: decoded.role,
      });
    }
    setIsLoading(false);
  }, []);

  const login = (role = "staff") => {
    const fakeToken = btoa(
      JSON.stringify({
        email: `${role}@example.com`,
        role,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );
    localStorage.setItem("token", fakeToken);
    setAuth({
      token: fakeToken,
      email: `${role}@example.com`,
      role,
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
