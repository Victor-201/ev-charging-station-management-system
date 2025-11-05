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

  // Giữ API tương thích với Login.jsx: login(email, password, remember)
  const login = (email = "staff@example.com", _password, _remember = true) => {
    // Suy luận vai trò từ email: chứa 'admin' -> admin, còn lại staff
    const role = /admin/i.test(email) ? "admin" : "staff";

    const payload = {
      email,
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const fakeToken = btoa(JSON.stringify(payload));

    // Lưu cả 'token' (giữ tương thích) và 'access_token' (để axios client nếu cần)
    localStorage.setItem("token", fakeToken);
    localStorage.setItem("access_token", fakeToken);

    setAuth({ token: fakeToken, email, role });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    setAuth({ token: null, role: null, email: null });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
