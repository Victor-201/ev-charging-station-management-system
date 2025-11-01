// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: { auth: authReducer },
  middleware: (getDefault) => getDefault(),
});

export default store;
