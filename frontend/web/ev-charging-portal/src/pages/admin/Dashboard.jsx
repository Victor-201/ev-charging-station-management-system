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
import Table from "@/components/admin/Table";
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
    revenue,
    alerts,
    getOverview,
    getRevenue,
    getAlerts,
  } = useAnalytics();

  const [kpis, setKpis] = useState({ users: 0, stations: 0, revenue: 0, sessions: 0 });
  const [trend, setTrend] = useState({ users: "+0%", revenue: "+0%", sessions: "+0%" });
  const [recent, setRecent] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [hasData, setHasData] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  // 🧮 Định dạng tiền VND
  const formatVND = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val || 0);

  // 📡 Gọi API qua service
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [overviewRes, revenueRes, usersRes, stationsRes] = await Promise.allSettled([
        getOverview(),
        getRevenue({ range: "week" }),
        userService.getAll(),
        stationService.getAll(),
      ]);

      const overviewData = overviewRes.value?.data ?? overview ?? {};
      const revenueTotal = revenueRes.value?.data?.total ?? revenue?.total ?? 0;
      const usersCount = usersRes.value?.data?.length ?? 0;
      const stationsCount = stationsRes.value?.data?.length ?? 0;

      const sessionsRes = await chargingControlService.getUserSessions();
      const sessions = sessionsRes?.data?.length ?? overviewData.total_sessions ?? 0;

      const newKpis = { users: usersCount, stations: stationsCount, revenue: revenueTotal, sessions };
      setKpis(newKpis);

      const noData = !usersCount && !stationsCount && !revenue && !sessions;
      setHasData(!noData);

      // ✅ Giả lập trend ngẫu nhiên
      const rnd = () =>
        (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 4).toFixed(1) + "%";
      setTrend({
        users: rnd(),
        revenue: rnd(),
        sessions: rnd(),
      });

      // ✅ Hoạt động gần đây (mock)
      setRecent([
        { id: "ORD-001", user: "Nguyễn Văn A", station: "Trạm Nguyễn Văn Linh", amount: 85000, time: "10:30 12/11" },
        { id: "ORD-002", user: "Trần Thị B", station: "Trạm Phạm Hùng", amount: 120000, time: "09:15 12/11" },
        { id: "ORD-003", user: "Lê Văn C", station: "Trạm Nguyễn Huệ", amount: 56000, time: "08:20 11/11" },
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
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  const loadTraffic = () => {
    const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
    setTraffic(days.map((d) => ({ label: d, value: Math.round(600 + Math.random() * 200) })));
  };

  useEffect(() => {
    loadDashboard();
    loadTraffic();
    const timer = setInterval(() => loadDashboard(), 60000);
    return () => clearInterval(timer);
  }, []);

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
            <button
              onClick={() => loadDashboard()}
              className="ml-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm transition"
            >
              <RefreshCw size={16} /> Làm mới
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

      {!hasData ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-400 p-10 bg-gray-50 dark:bg-gray-900/20 text-center">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Không có dữ liệu hiển thị
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vui lòng kiểm tra lại kết nối hoặc dữ liệu backend.
          </div>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Người dùng" value={loading ? "..." : kpis.users.toLocaleString()} icon={Users} trend={trend.users} />
            <StatCard title="Doanh thu (tuần)" value={loading ? "..." : formatVND(kpis.revenue)} icon={CreditCard} trend={trend.revenue} />
            <StatCard title="Phiên sạc" value={loading ? "..." : kpis.sessions.toLocaleString()} icon={PlugZap} trend={trend.sessions} />
          </div>

          {/* Chart */}
          <Section title="Biểu đồ lưu lượng tuần này (kWh)">
            <Chart height={260} data={traffic} />
            <div className="text-xs text-gray-500 mt-2 text-right">Lần cập nhật cuối: {lastUpdated}</div>
          </Section>

          {/* Recent Activities */}
          <Section title="Hoạt động gần đây">
            {alertsCount > 0 && (
              <p className="mb-2 text-xs text-amber-600">
                ⚠️ Cảnh báo hệ thống đang mở: <b>{alertsCount}</b>
              </p>
            )}
            {recent.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">📄 Chưa có giao dịch gần đây</div>
            ) : (
              <Table
                columns={[
                  { key: "id", title: "Mã GD", dataIndex: "id" },
                  { key: "user", title: "Người dùng", dataIndex: "user" },
                  { key: "station", title: "Trạm", dataIndex: "station" },
                  { key: "time", title: "Thời gian", dataIndex: "time" },
                  { key: "amount", title: "Số tiền", dataIndex: "amount", render: (v) => formatVND(v) },
                ]}
                data={recent}
              />
            )}
          </Section>
        </>
      )}
    </div>
  );
}
