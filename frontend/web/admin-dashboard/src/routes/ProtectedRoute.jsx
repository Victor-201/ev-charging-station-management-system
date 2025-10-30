import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const bypass = import.meta.env.VITE_BYPASS_AUTH === "true";
  if (bypass) return children;
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default ProtectedRoute;
