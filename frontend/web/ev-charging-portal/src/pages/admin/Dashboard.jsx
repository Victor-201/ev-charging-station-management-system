import { Users, CreditCard, PlugZap, Settings, Coins, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { useAnalytics } from "@/hooks/useAnalytics";
import chargingControlService from "@/services/chargingControlService";
import stationService from "@/services/stationService";
import userService from "@/services/userService";

import StatCard from "@/components/admin/StatCard";
import Section from "@/components/admin/Section";
import Chart from "@/components/admin/Chart";
import { ROUTERS } from "@/utils/constants";

/**
 * Dashboard.jsx (service-based version)
 * - Loại bỏ useAnalytics, useUser, useStation, useChargingControl
 * - Gọi trực tiếp API service
 * - Giữ nguyên UI, mock data, trend, auto-refresh
 */

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    overview,
    alerts,
    getOverview,
    getRevenueReport,
    getAlerts,
  } = useAnalytics();

  const [kpis, setKpis] = useState({ users: 0, stations: 0, revenue: 0, sessions: 0, energy_kwh: 0 });
  const [monthlyChart, setMonthlyChart] = useState([]); // 3 cột: Doanh thu, Phiên sạc, kWh
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return ym;
  });

  // 🧮 Định dạng tiền VND
  const formatVND = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Tính khoảng thời gian theo giá trị tháng (YYYY-MM)
  const getRangeFromMonth = (ym) => {
    const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
    const first = new Date(y, m - 1, 1).toISOString().slice(0, 10);
    const last = new Date(y, m, 0).toISOString().slice(0, 10);
    return { from: first, to: last };
  };

  // 📡 Gọi API
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { from, to } = getRangeFromMonth(month);

      const [overviewRes, revenueReportRes, usersRes, stationsRes] = await Promise.allSettled([
        getOverview(),
        getRevenueReport({ from, to }),
        userService.getAll(),
        stationService.getAll(),
      ]);

      const overviewData = overviewRes.value?.data ?? overview ?? {};
      const revArr = revenueReportRes.value?.data ?? [];
      const revenueTotal = Array.isArray(revArr) ? revArr.reduce((s, r) => s + (r.revenue || 0), 0) : 0;
      const sessionsTotal = Array.isArray(revArr) ? revArr.reduce((s, r) => s + (r.sessions || 0), 0) : 0;
      const energyTotal = Array.isArray(revArr) ? revArr.reduce((s, r) => s + (r.energy_kwh || 0), 0) : 0;
      const usersCount = usersRes.value?.data?.length ?? 0;
      const stationsCount = stationsRes.value?.data?.length ?? 0;

      const sessionsRes = await chargingControlService.getUserSessions();
      const sessions = sessionsRes?.data?.length ?? overviewData.total_sessions ?? sessionsTotal;

      const newKpis = { users: usersCount, stations: stationsCount, revenue: revenueTotal, sessions, energy_kwh: energyTotal };
      setKpis(newKpis);
      // Biểu đồ 3 cột theo tháng
      setMonthlyChart([
        { label: "Doanh thu (VND)", value: revenueTotal },
        { label: "Phiên sạc", value: sessions },
        { label: "Tổng điện (kWh)", value: energyTotal },
      ]);

      // Alerts via provider
      const alertsRes = await getAlerts();
      const alertsData = alertsRes?.data ?? alerts ?? [];
      setAlertsCount(Array.isArray(alertsData) ? alertsData.length : 0);
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
      setToastMsg("✅ Đã làm mới dữ liệu thành công!");
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {
      console.error("Dashboard error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(() => loadDashboard(), 60000);
    return () => clearInterval(timer);
  }, []);

  // Tự động reload khi đổi tháng
  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const quickCards = [
    { key: "users", title: "Users", subtitle: "Quản lý người dùng", icon: Users, route: ROUTERS.ADMIN.USER_MANAGEMENT },
    { key: "stations", title: "Stations", subtitle: "Quản lý trạm sạc", icon: PlugZap, route: ROUTERS.ADMIN.STATION_MANAGEMENT },
    { key: "reports", title: "Reports", subtitle: "Báo cáo & số liệu", icon: CreditCard, route: ROUTERS.ADMIN.REPORTS },
    { key: "subscriptions", title: "Subscriptions", subtitle: "Gói & quyền lợi", icon: Coins, route: ROUTERS.ADMIN.SUBSCRIPTION_PLANS },
    { key: "settings", title: "Settings", subtitle: "Cấu hình hệ thống", icon: Settings, route: ROUTERS.ADMIN.SETTINGS },
  ];

  return (
    <div className="space-y-6 relative">
      {/* Toast feedback */}
      {toastMsg && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="mx-auto w-full max-w-[980px]">
        <div className="w-full rounded-2xl border border-white/10 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-2xl">
          <div className="flex items-center gap-6 px-6 py-6">
            <div className="h-[120px] w-[120px] rounded-xl border-2 border-dashed border-white/20 bg-white/10 flex items-center justify-center">
              <div className="text-5xl">📊</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-extrabold mb-1">Bảng điều khiển Admin</div>
              <div className="opacity-90">Tổng quan và truy cập nhanh các khu vực quản trị</div>
            </div>
            <div className="text-sm opacity-80">
              🕒 Cập nhật lúc: <b>{lastUpdated}</b>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm opacity-90">Tháng:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded bg-white/20 px-2 py-1 text-white placeholder-white/60 focus:outline-none"
              />
            </div>
            <button
              onClick={() => loadDashboard()}
              disabled={loading}
              className={`ml-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                loading ? "bg-white/10 cursor-not-allowed opacity-70" : "bg-white/20 hover:bg-white/30"
              }`}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Buttons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickCards.map((c) => (
          <button
            key={c.key}
            onClick={() => navigate(c.route)}
            className="group flex min-h-[120px] items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 text-left shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-[64px] w-[64px] items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30">
                <c.icon size={28} />
              </div>
              <div>
                <div className="text-base font-extrabold">{c.title}</div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{c.subtitle}</div>
              </div>
            </div>
            <div className="text-xl font-bold text-blue-600 transition-transform group-hover:translate-x-1">→</div>
          </button>
        ))}
      </div>

      <>
          {/* KPI */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Người dùng" value={loading ? "..." : kpis.users.toLocaleString()} icon={Users} />
            <StatCard title="Doanh thu (tháng)" value={loading ? "..." : formatVND(kpis.revenue)} icon={CreditCard} />
            <StatCard title="Phiên sạc (tháng)" value={loading ? "..." : kpis.sessions.toLocaleString()} icon={PlugZap} />
          </div>

          {/* Chart 3 cột theo tháng */}
          <Section title="Tổng quan tháng này">
            <Chart height={260} data={monthlyChart} />
            <div className="text-xs text-gray-500 mt-2 text-right">Lần cập nhật cuối: {lastUpdated}</div>
          </Section>
        </>
    </div>
  );
}
