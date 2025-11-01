// src/hooks/useAuth.js
import { useDispatch, useSelector } from 'react-redux';
import { login, register, forgotPassword, refreshToken } from '../store/slices/authSlice';
import { useCallback } from 'react';

export default function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);

  const doLogin = useCallback((p) => dispatch(login(p)), [dispatch]);
  const doRegister = useCallback((p) => dispatch(register(p)), [dispatch]);
  const doForgot = useCallback((e) => dispatch(forgotPassword(e)), [dispatch]);
  const doRefresh = useCallback(() => dispatch(refreshToken()), [dispatch]);

  return { ...auth, doLogin, doRegister, doForgot, doRefresh };
}
