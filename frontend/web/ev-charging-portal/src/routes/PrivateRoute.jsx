import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import Loader from '@/components/common/Loader';

const PrivateRoute = ({ children, roles = [] }) => {
  const { auth, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Loader />;

  if (!auth?.token)
    return <Navigate to="/login" state={{ from: location }} replace />;

  if (roles.length > 0 && !roles.includes(auth.role))
    return <Navigate to="/403" replace />;

  return children;
};

export default PrivateRoute;
