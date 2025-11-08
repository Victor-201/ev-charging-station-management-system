// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import vehicleReducer from './slices/vehicleSlice';
import chargingReducer from './slices/chargingSlice';
import walletReducer from './slices/walletSlice';
import paymentReducer from './slices/paymentSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    vehicles: vehicleReducer,
    charging: chargingReducer,
    wallet: walletReducer,
    payment: paymentReducer,
  },
  middleware: (getDefault) => getDefault(),
});

export default store;
