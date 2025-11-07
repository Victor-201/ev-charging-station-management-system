// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import vehicleReducer from './slices/vehicleSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    vehicles: vehicleReducer,
  },
  middleware: (getDefault) => getDefault(),
});

export default store;
