import vehicleReducer, {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from '../../../src/store/slices/vehicleSlice';
import vehicleService from '../../../src/services/vehicleService';

// Mock vehicleService
jest.mock('../../../src/services/vehicleService');

describe('vehicleSlice', () => {
  const initialState = {
    vehicles: [],
    loading: false,
    error: null,
  };

  it('should handle initial state', () => {
    expect(vehicleReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('getVehicles', () => {
    it('should handle pending state', () => {
      const state = vehicleReducer(initialState, getVehicles.pending());
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const mockVehicles = [{ id: 1, make: 'Tesla' }];
      const state = vehicleReducer(initialState, getVehicles.fulfilled(mockVehicles));
      expect(state.loading).toBe(false);
      expect(state.vehicles).toEqual(mockVehicles);
    });

    it('should handle rejected state', () => {
      const error = { message: 'Failed to fetch' };
      const state = vehicleReducer(initialState, getVehicles.rejected(null, { payload: error }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe(error.message);
    });
  });

  describe('addVehicle', () => {
    it('should handle fulfilled state', () => {
      const newVehicle = { id: 2, make: 'VinFast' };
      const state = vehicleReducer(initialState, addVehicle.fulfilled(newVehicle));
      expect(state.vehicles).toHaveLength(1);
      expect(state.vehicles[0]).toEqual(newVehicle);
    });
  });

  describe('updateVehicle', () => {
    it('should handle fulfilled state', () => {
      const initial = { ...initialState, vehicles: [{ id: 1, make: 'Tesla', model: 'Model 3' }] };
      const updatedVehicle = { id: 1, make: 'Tesla', model: 'Model Y' };
      const state = vehicleReducer(initial, updateVehicle.fulfilled(updatedVehicle));
      expect(state.vehicles[0].model).toBe('Model Y');
    });
  });

  describe('deleteVehicle', () => {
    it('should handle fulfilled state', () => {
      const initial = { ...initialState, vehicles: [{ id: 1, make: 'Tesla' }, { id: 2, make: 'VinFast' }] };
      const state = vehicleReducer(initial, deleteVehicle.fulfilled(1));
      expect(state.vehicles).toHaveLength(1);
      expect(state.vehicles[0].id).toBe(2);
    });
  });
});
