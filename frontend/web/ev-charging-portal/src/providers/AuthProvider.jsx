import { useEffect, useState } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { tokenService } from "@/api/tokenService";
import { jwtDecode } from "jwt-decode";
import authService from "@/services/authService";

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, role: null, email: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const access = tokenService.getAccess();
      if (access) {
        const decoded = jwtDecode(access);
        setAuth({ token: access, role: decoded?.role ?? null, email: decoded?.email ?? null });
      }
    } catch (_) {
      tokenService.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password, remember = true) => {
    // Gọi API thật; nếu backend chưa sẵn sàng có thể switch lại AuthProvider.fake trong main.jsx
    const res = await authService.login({ email, password, remember });
    // Kỳ vọng API trả { accessToken, refreshToken, role, email }
    const { accessToken, refreshToken } = res;
    tokenService.setTokens({ accessToken, refreshToken });
    const decoded = jwtDecode(accessToken);
    setAuth({ token: accessToken, role: decoded?.role ?? res.role, email: decoded?.email ?? res.email });
  };

  const logout = async () => {
    try { await authService.logout(); } catch (_) { /* ignore */ }
    tokenService.clear();
    setAuth({ token: null, role: null, email: null });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
