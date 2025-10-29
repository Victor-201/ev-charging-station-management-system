import { NavLink } from "react-router-dom";
import routes from "../routes/index.jsx";

const baseItemClasses =
  "flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors";

function Sidebar() {
  return (
    <aside className="h-screen w-64 bg-ev-gunmetal text-white flex flex-col gap-8 px-6 py-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-ev-sky/20 flex items-center justify-center text-ev-sky font-bold">
          EV
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-ev-ice/60">Admin</p>
          <p className="text-lg font-semibold">Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              `${baseItemClasses} ${isActive ? "bg-ev-teal text-ev-ice" : "bg-transparent hover:bg-white/10"}`
            }
          >
            <span>{route.label}</span>
            <span className="text-xs text-ev-ice/60">&rsaquo;</span>
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 text-xs text-ev-ice/50">
        <p>EV Charging Suite</p>
        <p>Version 1.0.0</p>
      </div>
    </aside>
  );
}

export default Sidebar;
