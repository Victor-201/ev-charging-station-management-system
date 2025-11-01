import { Routes, Route, Navigate } from "react-router-dom";
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

import { ROUTERS } from "@/utils/constants";

const routeConfig = [
  // Public routes
  { path: ROUTERS.PUBLIC.LOGIN, element: Login, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.REGISTER, element: Register, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.FORGOT_PASSWORD, element: ForgotPassword, layout: AuthLayout },

  // Staff routes
  { path: ROUTERS.STAFF.HOME, element: DashboardStaff, layout: StaffLayout, roles: ["staff", "admin"] },

  // Admin routes
  { path: ROUTERS.ADMIN.DASHBOARD, element: DashboardAdmin, layout: AdminLayout, roles: ["admin"] },

  // Error pages
  { path: ROUTERS.PRIVATE.FORBIDDEN, element: Forbidden },
  { path: ROUTERS.PUBLIC.NOT_FOUND, element: NotFound },
];

const AppRouter = () => {
  return (
    <Routes>
      {routeConfig.map((route) => {
        const Content = route.layout
          ? () => <route.layout><route.element /></route.layout>
          : route.element;

        const element = route.roles
          ? <PrivateRoute roles={route.roles}><Content /></PrivateRoute>
          : <Content />;

        return <Route key={route.path} path={route.path} element={element} />;
      })}

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to={ROUTERS.PUBLIC.LOGIN} replace />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
