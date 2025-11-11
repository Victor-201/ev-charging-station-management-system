import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from '../store/slices/vehicleSlice';

/**
 * Custom hook for managing vehicle data and actions.
 * Provides an interface to the vehicle slice.
 */
export default function useVehicles() {
  const dispatch = useDispatch();
  const { vehicles, loading, error } = useSelector((state) => state.vehicles || {});
  const authUser = useSelector((state) => state.auth?.user);
  const effectiveUserId = authUser?.id || authUser?.user_id || authUser?.sub;

  // --- Action Dispatchers ---

  const fetchVehicles = useCallback(
    (userId) => {
      const uid = userId || effectiveUserId;
      if (!uid) return Promise.reject('No user ID available');
      return dispatch(getVehicles(uid)).unwrap();
    },
    [dispatch, effectiveUserId]
  );

  const createVehicle = useCallback(
    (vehicleData, userId) => {
      const uid = userId || effectiveUserId;
      if (!uid) return Promise.reject('No user ID available');
      return dispatch(addVehicle({ userId: uid, vehicleData })).unwrap();
    },
    [dispatch, effectiveUserId]
  );

  const modifyVehicle = useCallback(
    (vehicleId, vehicleData) => {
      if (!vehicleId) return Promise.reject('Vehicle ID is required');
      return dispatch(updateVehicle({ vehicleId, vehicleData })).unwrap();
    },
    [dispatch]
  );

  const removeVehicle = useCallback(
    (vehicleId) => {
      if (!vehicleId) return Promise.reject('Vehicle ID is required');
      return dispatch(deleteVehicle(vehicleId)).unwrap();
    },
    [dispatch]
  );

  // --- Helper Functions ---

  const getVehicleById = useCallback(
    (vehicleId) => {
      return vehicles.find((v) => v.id === vehicleId || v.vehicle_id === vehicleId);
    },
    [vehicles]
  );

  const hasVehicles = vehicles && vehicles.length > 0;

  return {
    // State
    vehicles,
    loading,
    error,
    hasVehicles,

    // Actions
    fetchVehicles,
    createVehicle,
    modifyVehicle,
    removeVehicle,

    // Helpers
    getVehicleById,
  };
}

