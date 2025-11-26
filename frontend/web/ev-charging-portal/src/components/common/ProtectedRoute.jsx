import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * ProtectedRoute wrapper
 * Usage:
 * <ProtectedRoute>
 *   <YourProtectedPage />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children }) {
  const auth = useAuth();
  // adapt check depending on your auth shape (user / isAuthenticated)
  const isAuthenticated = !!(auth?.user || auth?.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // redirect to login and keep the attempted location in state
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
}
