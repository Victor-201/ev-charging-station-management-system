import { Routes, Route, Navigate } from "react-router-dom";

// Routes
import PrivateRoute from "@/routes/PrivateRoute";
import PublicRoute from "@/routes/PublicRoute";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";
import StaffLayout from "@/layouts/StaffLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Admin pages
import DashboardAdmin from "@/pages/admin/Dashboard";
import AnalyticsAdmin from "@/pages/admin/Analytics";
import StationManagementAdmin from "@/pages/admin/StationManagement";
import SubscriptionPlansAdmin from "@/pages/admin/SubscriptionPlans";
import UserManagementAdmin from "@/pages/admin/UserManagement";

// Staff pages
import DashboardStaff from "@/pages/staff/Dashboard";
import Payments from "@/pages/staff/PaymentPage";
import Stations from "@/pages/staff/StationStatus";
import Sessions from "@/pages/staff/session";
import SettingsStaff from "@/pages/staff/Settings";
import ScanPage from "@/pages/staff/ScanPage";
import IncidentReport from "@/pages/staff/IncidentReport";

// Errors
import NotFound from "@/pages/error/NotFound";
import Forbidden from "@/pages/error/Forbidden";

// Constants
import { ROUTERS } from "@/utils/constants";

const routeConfig = [
  // ===== PUBLIC ROUTES =====
  { path: ROUTERS.PUBLIC.LOGIN, element: Login, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.REGISTER, element: Register, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.FORGOT_PASSWORD, element: ForgotPassword, layout: AuthLayout },

  // ===== STAFF ROUTES =====
  { path: ROUTERS.STAFF.DASHBOARD, element: DashboardStaff, layout: StaffLayout, roles: ["staff"] },
  { path: ROUTERS.STAFF.PAYMENTS, element: Payments, layout: StaffLayout, roles: ["staff"] },
  { path: ROUTERS.STAFF.STATIONS, element: Stations, layout: StaffLayout, roles: ["staff"] },
  { path: ROUTERS.STAFF.SESSIONS, element: Sessions, layout: StaffLayout, roles: ["staff"] },
  { path: ROUTERS.STAFF.SETTINGS, element: SettingsStaff, layout: StaffLayout, roles: ["staff"] },
  { path: ROUTERS.STAFF.SCAN, element: ScanPage, layout: StaffLayout, roles: ["staff"] },
  { path: ROUTERS.STAFF.INCIDENT_REPORT, element: IncidentReport, layout: StaffLayout, roles: ["staff"] },

  // ===== ADMIN ROUTES =====
  { path: ROUTERS.ADMIN.DASHBOARD, element: DashboardAdmin, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.ANALYTICS, element: AnalyticsAdmin, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.STATION_MANAGEMENT, element: StationManagementAdmin, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.SUBSCRIPTION_PLANS, element: SubscriptionPlansAdmin, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.USER_MANAGEMENT, element: UserManagementAdmin, layout: AdminLayout, roles: ["admin"] },

  // ===== ERROR ROUTES =====
  { path: ROUTERS.PRIVATE.FORBIDDEN, element: Forbidden },
  { path: ROUTERS.PUBLIC.NOT_FOUND, element: NotFound },
];

const AppRouter = () => {
  return (
    <Routes>
      {routeConfig.map((route) => {
        // Wrap with layout if exists
        const Content = route.layout
          ? () => (
              <route.layout>
                <route.element />
              </route.layout>
            )
          : route.element;

        let element = <Content />;

        // Private route → requires login
        if (route.roles) {
          element = (
            <PrivateRoute roles={route.roles}>
              {element}
            </PrivateRoute>
          );
        } else {
          // Public route → block access when user already logged in
          element = (
            <PublicRoute>
              {element}
            </PublicRoute>
          );
        }

        return <Route key={route.path} path={route.path} element={element} />;
      })}

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={ROUTERS.PUBLIC.LOGIN} replace />} />

      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
