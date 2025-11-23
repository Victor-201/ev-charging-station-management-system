import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";

import {
  Home,
  BarChart3,
  Zap,
  Coins,
  Users,
  Settings,
} from "lucide-react"; // 👈 icon chuẩn, trắng, đơn giản

export default function AdminSidebar({ active = true }) {
  const [expanded, setExpanded] = useState(active);

  const items = [
    {
      key: "dashboard",
      label: "Dashboard",
      to: ROUTERS.ADMIN.DASHBOARD,
      icon: <Home size={20} />,
    },
    {
      key: "analytics",
      label: "Analytics",
      to: ROUTERS.ADMIN.ANALYTICS,
      icon: <BarChart3 size={20} />,
    },
    {
      key: "stations",
      label: "Stations",
      to: ROUTERS.ADMIN.STATION_MANAGEMENT,
      icon: <Zap size={20} />,
    },
    {
      key: "subscriptions",
      label: "Subscriptions",
      to: ROUTERS.ADMIN.SUBSCRIPTION_PLANS,
      icon: <Coins size={20} />,
    },
    {
      key: "users",
      label: "Users",
      to: ROUTERS.ADMIN.USER_MANAGEMENT,
      icon: <Users size={20} />,
    },
  ];

  return (
    <aside
      className={`${
        expanded ? "w-[260px]" : "w-[80px]"
      } bg-[rgba(6,16,37,0.95)] text-white flex flex-col justify-between gap-3 py-4 px-3 transition-all duration-300 relative h-screen overflow-visible`}
    >
      {/* ==== HEADER / LOGO ==== */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 select-none">
          <div className="text-2xl w-11 h-11 grid place-items-center rounded-xl bg-[rgba(255,255,255,0.05)]">
            <Zap size={22} />
          </div>
          {expanded && (
            <div className="font-bold text-[16px]">
              EV <span className="text-[#0f62fe] font-extrabold">Admin</span>
            </div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label="Toggle sidebar"
          className={`${
            expanded
              ? "w-9 h-9 text-[rgba(255,255,255,0.65)]"
              : "absolute right-[-18px] top-3 w-12 h-12 bg-[#0f62fe] text-white shadow-[0_8px_30px_rgba(15,98,254,0.18)] rounded-xl z-50"
          } grid place-items-center rounded-lg transition-all duration-200 hover:scale-105`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className={`${!expanded ? "rotate-180" : ""} transition-transform`}
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* ==== NAVIGATION ==== */}
      <nav
        className="flex flex-col gap-1 mt-2"
        role="navigation"
        aria-label="Admin navigation"
      >
        {items.map((i) => (
          <NavLink
            key={i.key}
            to={i.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-[rgba(15,98,254,0.18)] text-white shadow-[inset_4px_0_0_#0f62fe]"
                  : "text-white/60 hover:text-white hover:bg-[rgba(255,255,255,0.05)] hover:translate-x-[2px]"
              }`
            }
          >
            {/* ICON */}
            <span className="w-9 h-9 grid place-items-center text-white">
              {i.icon}
            </span>

            {expanded && (
              <>
                <span className="text-[14px] font-semibold text-white">
                  {i.label}
                </span>
                <span className="ml-auto text-[18px] text-white/40">›</span>
              </>
            )}

            {/* Tooltip when collapsed */}
            {!expanded && (
              <span className="absolute left-[90px] top-1/2 -translate-y-1/2 bg-[rgba(7,16,30,0.98)] text-white px-3 py-2 rounded-lg text-[13px] whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150 z-50">
                {i.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ==== FOOTER ==== */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-[rgba(255,255,255,0.03)]">
        {expanded ? (
          <>
            <div className="text-[12px] text-[rgba(255,255,255,0.45)]">
              v1.0.0
            </div>
            <div className="opacity-90 text-lg cursor-pointer">
              <Settings size={20} />
            </div>
          </>
        ) : (
          <div className="opacity-90 text-lg cursor-pointer">
            <Settings size={20} />
          </div>
        )}
      </div>
    </aside>
  );
}
