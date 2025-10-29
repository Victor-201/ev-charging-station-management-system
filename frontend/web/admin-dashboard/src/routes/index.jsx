import Overview from "../pages/Overview.jsx";
import Stations from "../pages/Stations.jsx";
import Users from "../pages/Users.jsx";
import Pricing from "../pages/Pricing.jsx";
import Reports from "../pages/Reports.jsx";

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
  }
];

export default routes;
