import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";
import PrivateRoute from "@/routes/PrivateRoute";

import AdminLayout from "@/layouts/AdminLayout";
import StaffLayout from "@/layouts/StaffLayout";
import AuthLayout from "@/layouts/AuthLayout";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import DashboardAdmin from "@/pages/admin/Dashboard";
import DashboardStaff from "@/pages/staff/Dashboard";
import NotFound from "@/pages/error/NotFound";
import Forbidden from "@/pages/error/Forbidden";

const AppRouter = () => {
  return (
    <Routes>
      <Route
        path={ROUTERS.PUBLIC.LOGIN}
        element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        }
      />
      <Route
        path={ROUTERS.PUBLIC.REGISTER}
        element={
          <AuthLayout>
            <Register />
          </AuthLayout>
        }
      />
      <Route
        path={ROUTERS.PUBLIC.FORGOT_PASSWORD}
        element={
          <AuthLayout>
            <ForgotPassword />
          </AuthLayout>
        }
      />
      <Route
        path={ROUTERS.STAFF.HOME}
        element={
          <PrivateRoute roles={["staff", "admin"]}>
            <StaffLayout>
              <DashboardStaff />
            </StaffLayout>
          </PrivateRoute>
        }
      />
      <Route
        path={ROUTERS.ADMIN.DASHBOARD}
        element={
          <PrivateRoute roles={["admin"]}>
            <AdminLayout>
              <DashboardAdmin />
            </AdminLayout>
          </PrivateRoute>
        }
      />
      <Route path={ROUTERS.PRIVATE.FORBIDDEN} element={<Forbidden />} />
      <Route path={ROUTERS.PUBLIC.NOT_FOUND} element={<NotFound />} />
      <Route path="/" element={<Navigate to={ROUTERS.PUBLIC.LOGIN} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
