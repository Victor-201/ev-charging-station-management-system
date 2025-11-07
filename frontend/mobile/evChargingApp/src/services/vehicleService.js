import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const vehicleService = {
  getVehicles: (userId) => {
    const url = ENDPOINTS.VEHICLE.LIST.replace(':user_id', userId);
    return apiClient.get(url);
  },

  addVehicle: (userId, vehicleData) => {
    const url = ENDPOINTS.VEHICLE.ADD.replace(':user_id', userId);
    return apiClient.post(url, vehicleData);
  },

  updateVehicle: (vehicleId, vehicleData) => {
    const url = ENDPOINTS.VEHICLE.UPDATE.replace(':vehicle_id', vehicleId);
    return apiClient.put(url, vehicleData);
  },

  deleteVehicle: (vehicleId) => {
    const url = ENDPOINTS.VEHICLE.DELETE.replace(':vehicle_id', vehicleId);
    return apiClient.delete(url);
  },
};

export default vehicleService;
