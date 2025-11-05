import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "@/routes/PrivateRoute";

import AdminLayout from "@/layouts/AdminLayout";
import StaffLayout from "@/layouts/StaffLayout";
import AuthLayout from "@/layouts/AuthLayout";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

import DashboardAdmin from "@/pages/admin/Dashboard";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminReports from "@/pages/admin/Reports";
import AdminSettings from "@/pages/admin/Settings";
import AdminStations from "@/pages/admin/StationManagement";
import AdminSubscriptions from "@/pages/admin/SubscriptionPlans";
import AdminUsers from "@/pages/admin/UserManagement";
import DashboardStaff from "@/pages/staff/Dashboard";
import Payments from "@/pages/staff/PaymentPage";
import Stations from "@/pages/staff/StationStatus";
import Sessions from "@/pages/staff/session";
import Settings from "@/pages/staff/Settings";
import ScanPage from "@/pages/staff/ScanPage";
import IncidentReport from "@/pages/staff/IncidentReport";

import NotFound from "@/pages/error/NotFound";
import Forbidden from "@/pages/error/Forbidden";

import { ROUTERS } from "@/utils/constants";

const routeConfig = [
  // 🔓 Public routes
  { path: ROUTERS.PUBLIC.LOGIN, element: Login, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.REGISTER, element: Register, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.FORGOT_PASSWORD, element: ForgotPassword, layout: AuthLayout },

  // 👨‍💼 Staff routes
  { path: ROUTERS.STAFF.DASHBOARD, element: DashboardStaff, layout: StaffLayout, roles: ["staff", "admin"] },
  { path: ROUTERS.STAFF.PAYMENTS, element: Payments, layout: StaffLayout, roles: ["staff", "admin"] },
  { path: ROUTERS.STAFF.STATIONS, element: Stations, layout: StaffLayout, roles: ["staff", "admin"] },
  { path: ROUTERS.STAFF.SESSIONS, element: Sessions, layout: StaffLayout, roles: ["staff", "admin"] },
  { path: ROUTERS.STAFF.SETTINGS, element: Settings, layout: StaffLayout, roles: ["staff", "admin"] },
  { path: ROUTERS.STAFF.SCAN, element: ScanPage, layout: StaffLayout, roles: ["staff", "admin"] },
  { path: ROUTERS.STAFF.INCIDENT_REPORT, element: IncidentReport, layout: StaffLayout, roles: ["staff", "admin"] },

  // 👑 Admin routes
  { path: ROUTERS.ADMIN.DASHBOARD, element: DashboardAdmin, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.ANALYTICS, element: AdminAnalytics, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.REPORTS, element: AdminReports, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.SETTINGS, element: AdminSettings, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.STATION_MANAGEMENT, element: AdminStations, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.SUBSCRIPTION_PLANS, element: AdminSubscriptions, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.USER_MANAGEMENT, element: AdminUsers, layout: AdminLayout, roles: ["admin"] },

  // 🚫 Error pages
  { path: ROUTERS.PRIVATE.FORBIDDEN, element: Forbidden },
  { path: ROUTERS.PUBLIC.NOT_FOUND, element: NotFound },
];

const AppRouter = () => {
  return (
    <Routes>
      {routeConfig.map((route) => {
        // Nếu có layout, bọc layout → component
        const Content = route.layout
          ? () => (
              <route.layout>
                <route.element />
              </route.layout>
            )
          : route.element;

        const element = route.roles
          ? (
              <PrivateRoute roles={route.roles}>
                <Content />
              </PrivateRoute>
            )
          : <Content />;

        return <Route key={route.path} path={route.path} element={element} />;
      })}

      {/* Redirect root → /staff/dashboard */}
      <Route path="/" element={<Navigate to={ROUTERS.STAFF.DASHBOARD} replace />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
