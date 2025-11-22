import { Routes, Route, Navigate } from "react-router-dom";
// ⚙️ Tạm bỏ PrivateRoute khi test UI
// import PrivateRoute from "@/routes/PrivateRoute";

import AdminLayout from "@/layouts/AdminLayout";
import StaffLayout from "@/layouts/StaffLayout";
import AuthLayout from "@/layouts/AuthLayout";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

import DashboardAdmin from "@/pages/admin/Dashboard";
import AnalyticsAdmin from "@/pages/admin/Analytics";
import StationManagementAdmin from "@/pages/admin/StationManagement";
import SubscriptionPlansAdmin from "@/pages/admin/SubscriptionPlans";
import UserManagementAdmin from "@/pages/admin/UserManagement";

import DashboardStaff from "@/pages/staff/Dashboard";
import Payments from "@/pages/staff/PaymentPage";
import Stations from "@/pages/staff/StationStatus";
import Sessions from "@/pages/staff/session";
import SettingsStaff from "@/pages/staff/Settings";
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

  // 👷‍♂️ Staff routes
  { path: ROUTERS.STAFF.DASHBOARD, element: DashboardStaff, layout: StaffLayout },
  { path: ROUTERS.STAFF.PAYMENTS, element: Payments, layout: StaffLayout },
  { path: ROUTERS.STAFF.STATIONS, element: Stations, layout: StaffLayout },
  { path: ROUTERS.STAFF.SESSIONS, element: Sessions, layout: StaffLayout },
  { path: ROUTERS.STAFF.SETTINGS, element: SettingsStaff, layout: StaffLayout },
  { path: ROUTERS.STAFF.SCAN, element: ScanPage, layout: StaffLayout },
  { path: ROUTERS.STAFF.INCIDENT_REPORT, element: IncidentReport, layout: StaffLayout },

  // 🧑‍💼 Admin routes
  { path: ROUTERS.ADMIN.DASHBOARD, element: DashboardAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.ANALYTICS, element: AnalyticsAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.REPORTS, element: ReportsAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.STATION_MANAGEMENT, element: StationManagementAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.SUBSCRIPTION_PLANS, element: SubscriptionPlansAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.USER_MANAGEMENT, element: UserManagementAdmin, layout: AdminLayout },

  // 🚫 Error pages
  { path: ROUTERS.PRIVATE.FORBIDDEN, element: Forbidden },
  { path: ROUTERS.PUBLIC.NOT_FOUND, element: NotFound },
];

const AppRouter = () => {
  return (
    <Routes>
      {routeConfig.map((route) => {
        const Content = route.layout
          ? () => (
              <route.layout>
                <route.element />
              </route.layout>
            )
          : route.element;

        const element = <Content />;

        return <Route key={route.path} path={route.path} element={element} />;
      })}

      {/* Redirect root → /staff/dashboard */}
      <Route path="/" element={<Navigate to={ROUTERS.LOGIN} replace />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
