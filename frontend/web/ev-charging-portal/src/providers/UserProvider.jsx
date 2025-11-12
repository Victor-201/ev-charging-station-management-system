import React, { useState, useCallback, useEffect, useMemo } from "react";
import { UserContext } from "@/contexts/UserContext";
import userService from "@/services/userService"; // sửa path nếu cần

// Provider quản lý thông tin user, trạng thái loading, lỗi và cung cấp các helper
// Sử dụng trong app như:
// <UserProvider><App /></UserProvider>

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy profile từ API
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getProfile();
      // Giả sử apiClient trả về data ở res.data hoặc trực tiếp res
      const payload = res?.data ?? res;
      setUser(payload ?? null);
      setLoading(false);
      return payload;
    } catch (err) {
      setError(err);
      setUser(null);
      setLoading(false);
      throw err; // rethrow nếu caller muốn xử lý
    }
  }, []);

  // Tự động fetch profile khi provider mount
  useEffect(() => {
    // Nếu muốn chỉ gọi khi có token, kiểm tra ở đây (ví dụ localStorage.getItem('token'))
    
    fetchProfile().catch(() => {});
  }, [fetchProfile]);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : patch));
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    setError(null);
    setLoading(false);
    // Nếu cần xóa token/session phía client: localStorage.removeItem('token')
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      updateUser,
      clearUser,
      loading,
      error,
      refreshProfile: fetchProfile,
    }),
    [user, loading, error, fetchProfile, updateUser, clearUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;
