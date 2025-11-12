// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import vehicleReducer from './slices/vehicleSlice';
import chargingReducer from './slices/chargingSlice';
import walletReducer from './slices/walletSlice';
import paymentReducer from './slices/paymentSlice';
import reservationReducer from './slices/reservationSlice';
import notificationReducer from './slices/notificationSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import stationReducer from './slices/stationSlice';



const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    vehicles: vehicleReducer,
    charging: chargingReducer,
    wallet: walletReducer,
    payment: paymentReducer,
    reservation: reservationReducer,
    subscriptions: subscriptionReducer,
    stations: stationReducer,


    notification: notificationReducer,
  },
  middleware: (getDefault) => getDefault(),
});

export default store;
