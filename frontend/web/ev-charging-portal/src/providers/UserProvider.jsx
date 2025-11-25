import React, { useState, useCallback, useEffect, useMemo } from "react";
import { UserContext } from "@/contexts/UserContext";
import userService from "@/services/userService";

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // chi tiết user theo id
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ================================
        GET PROFILE
  ================================= */
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
        GET ALL USERS (ADMIN)
  ================================= */
  const fetchAllUsers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAllUsers(params);
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
        GET USER BY ID
  ================================= */
  const fetchUserById = useCallback(async (userId) => {
    if (!userId) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUserById(userId);
      setSelectedUser(data ?? null);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err);
      setSelectedUser(null);
      setLoading(false);
      throw err;
    }
  }, []);

  /* ================================
        UPDATE USER
  ================================= */
  const updateUser = useCallback(
    async (id, patch) => {
      await userService.updateUser(id, patch);
      await fetchAllUsers();
    },
    [fetchAllUsers]
  );

  /* ================================
        DELETE USER
  ================================= */
  const deleteUser = useCallback(
    async (id) => {
      await userService.deleteUser(id);
      await fetchAllUsers();
    },
    [fetchAllUsers]
  );

  /* ================================
        LOGOUT USER
  ================================= */
  const logout = useCallback(
    async (refreshToken) => {
      setLoading(true);
      setError(null);
      try {
        await userService.logout(refreshToken);
        setUser(null);
        setUserList([]);
        setSelectedUser(null);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
        throw err;
      }
    },
    []
  );

  /* ================================
        AUTO LOAD PROFILE
  ================================= */
  useEffect(() => {
    fetchProfile().catch(() => {});
  }, [fetchProfile]);

  /* ================================
        PROVIDER VALUE
  ================================= */
  const value = useMemo(
    () => ({
      user,
      userList,
      selectedUser,
      loading,
      error,

      fetchProfile,
      fetchAllUsers,
      fetchUserById,
      updateUser,
      deleteUser,
      logout
    }),
    [user, userList, selectedUser, loading, error, fetchProfile, fetchAllUsers, fetchUserById, updateUser, deleteUser, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;
