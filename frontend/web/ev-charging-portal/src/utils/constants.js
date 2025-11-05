export const ROUTERS = {
  STAFF: {
    HOME: "/staff",
    DASHBOARD: "/staff/dashboard",
    PAYMENTS: "/staff/payments",
    STATIONS: "/staff/stations",
    SESSIONS: "/staff/sessions",
    SETTINGS: "/staff/settings",
    SCAN: "/staff/scan",
    INCIDENT_REPORT: "/staff/incidents",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    ANALYTICS: "/admin/analytics",
    REPORTS: "/admin/reports",
    SETTINGS: "/admin/settings",
    STATION_MANAGEMENT: "/admin/stations",
    SUBSCRIPTION_PLANS: "/admin/subscriptions",
    USER_MANAGEMENT: "/admin/users",
  },
  PUBLIC: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    NOT_FOUND: "/404",
  },
  PRIVATE: {
    FORBIDDEN: "/403",
  },
};
