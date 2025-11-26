import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTERS } from "@/utils/constants";
import Loader from "@/components/common/Loader";

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // chờ auth load
  if (loading) return <Loader />;

  // chưa login → redirect login
  if (!user) {
    return (
      <Navigate
        to={ROUTERS.PUBLIC.LOGIN}
        replace
        state={{ from: location }}
      />
    );
  }

  // sai role → 403
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={ROUTERS.PRIVATE.FORBIDDEN} replace />;
  }

  // hợp lệ → cho vào
  return children;
};

export default PrivateRoute;
