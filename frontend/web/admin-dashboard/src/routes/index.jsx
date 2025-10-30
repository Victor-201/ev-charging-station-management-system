import Overview from "../pages/Overview.jsx";
import Stations from "../pages/Stations.jsx";
import Users from "../pages/Users.jsx";
import Pricing from "../pages/Pricing.jsx";
import Reports from "../pages/Reports.jsx";
import Alerts from "../pages/Alerts.jsx";
import Forecast from "../pages/Forecast.jsx";
import Settings from "../pages/Settings.jsx";

const routes = [
  {
    path: "/overview",
    label: "Overview",
    element: <Overview />
  },
  {
    path: "/stations",
    label: "Stations",
    element: <Stations />
  },
  {
    path: "/pricing",
    label: "Pricing & Plans",
    element: <Pricing />
  },
  {
    path: "/users",
    label: "Users & Roles",
    element: <Users />
  },
  {
    path: "/reports",
    label: "Reports",
    element: <Reports />
  },
  { path: "/alerts", label: "Alerts", element: <Alerts /> },
  { path: "/forecast", label: "Forecast", element: <Forecast /> },
  { path: "/settings", label: "Settings", element: <Settings /> }
];

export default routes;
