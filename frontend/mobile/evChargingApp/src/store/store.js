// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import vehicleReducer from './slices/vehicleSlice';
import chargingReducer from './slices/chargingSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    vehicles: vehicleReducer,
    charging: chargingReducer,
  },
  middleware: (getDefault) => getDefault(),
});

export default store;
