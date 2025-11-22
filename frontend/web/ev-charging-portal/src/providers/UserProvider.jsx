import React, { useState, useCallback, useEffect, useMemo } from "react";
import { UserContext } from "@/contexts/UserContext";
import userService from "@/services/userService";

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ================================
        GET PROFILE
  ================================== */
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getProfile();
      setUser(data ?? null);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err);
      setUser(null);
      setLoading(false);
      throw err;
    }
  }, []);

  /* ================================
        GET ALL USERS (ADMIN) WITH LIMIT
  ================================== */
  const fetchAllUsers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAllUsers({
        page: params.page ?? 1,
        size: params.size ?? 20,
        q: params.q ?? "",
        role: params.role ?? "",
        status: params.status ?? "",
      });
      setUserList(Array.isArray(data?.users) ? data.users : []);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err);
      setUserList([]);
      setLoading(false);
      throw err;
    }
  }, []);

  /* ================================
        UPDATE USER
  ================================== */
  const updateUser = useCallback(
    async (id, patch) => {
      await userService.updateUser(id, patch);
      await fetchAllUsers();
    },
    [fetchAllUsers]
  );

  /* ================================
        DELETE USER
  ================================== */
  const deleteUser = useCallback(
    async (id) => {
      await userService.deleteUser(id);
      await fetchAllUsers();
    },
    [fetchAllUsers]
  );

  /* ================================
        AUTO LOAD PROFILE
  ================================== */
  useEffect(() => {
    fetchProfile().catch(() => {});
  }, [fetchProfile]);

  /* ================================
        PROVIDER VALUE
  ================================== */
  const value = useMemo(
    () => ({
      user,
      userList,
      loading,
      error,

      fetchProfile,
      fetchAllUsers,
      updateUser,
      deleteUser,
    }),
    [user, userList, loading, error, fetchProfile, fetchAllUsers, updateUser, deleteUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;
