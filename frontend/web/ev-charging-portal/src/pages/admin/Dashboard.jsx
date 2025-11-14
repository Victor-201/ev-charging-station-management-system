import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CreditCard, PlugZap, Settings, Coins, RefreshCw } from "lucide-react";

import { useAnalytics } from "@/hooks/useAnalytics";
import Section from "@/components/admin/Section";
import StatCard from "@/components/admin/StatCard";
import Chart from "@/components/admin/Chart";
import { ROUTERS } from "@/utils/constants";

export default function Dashboard() {
  const navigate = useNavigate();
  const { overview, getOverview, getRevenueReport, alerts, getAlerts } = useAnalytics();

  const [kpis, setKpis] = useState({
    users: 0,
    stations: 0,
    revenue: 0,
    sessions: 0,
    energy_kwh: 0,
  });
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const [month, setMonth] = useState(() => {
    const d = new Date();
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return ym;
  });

  const formatVND = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const getRangeFromMonth = (ym) => {
    const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
    const first = new Date(y, m - 1, 1).toISOString().slice(0, 10);
    const last = new Date(y, m, 0).toISOString().slice(0, 10);
    return { from: first, to: last };
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { from, to } = getRangeFromMonth(month);
      const [overviewRes, revenueRes, alertsRes] = await Promise.allSettled([
        getOverview(),
        getRevenueReport({ from, to }),
        getAlerts(),
      ]);

      const overviewData = overviewRes.value?.data ?? overview ?? {};

      const revArr = revenueRes.value?.data ?? [];
      const revenueTotal = Array.isArray(revArr)
        ? revArr.reduce((s, r) => s + (r.revenue || 0), 0)
        : 0;
      const sessionsTotal = Array.isArray(revArr)
        ? revArr.reduce((s, r) => s + (r.sessions || 0), 0)
        : 0;
      const energyTotal = Array.isArray(revArr)
        ? revArr.reduce((s, r) => s + (r.energy_kwh || 0), 0)
        : 0;

      const usersCount =
        overviewData.total_users ??
        overviewData.users ??
        0;
      const stationsCount =
        overviewData.total_stations ??
        overviewData.stations ??
        0;

      setKpis({
        users: usersCount,
        stations: stationsCount,
        revenue: revenueTotal,
        sessions: sessionsTotal,
        energy_kwh: energyTotal,
      });

      setMonthlyChart([
        { label: "Doanh thu (VND)", value: revenueTotal },
        { label: "Phiên sạc", value: sessionsTotal },
        { label: "Tổng điện (kWh)", value: energyTotal },
      ]);

      const alertsData = alertsRes.value?.data ?? alerts ?? [];
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
    const timer = setInterval(() => {
      const auto = JSON.parse(
        localStorage.getItem("evcs_auto_refresh") || "true"
      );
      if (auto) loadDashboard();
    }, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const quickCards = useMemo(
    () => [
      {
        key: "users",
        title: "Users",
        subtitle: "Quản lý người dùng",
        icon: Users,
        route: ROUTERS.ADMIN.USER_MANAGEMENT,
      },
      {
        key: "stations",
        title: "Stations",
        subtitle: "Quản lý trạm sạc",
        icon: PlugZap,
        route: ROUTERS.ADMIN.STATION_MANAGEMENT,
      },
      {
        key: "reports",
        title: "Reports",
        subtitle: "Báo cáo & số liệu",
        icon: CreditCard,
        route: ROUTERS.ADMIN.REPORTS,
      },
      {
        key: "subscriptions",
        title: "Subscriptions",
        subtitle: "Gói & quyền lợi",
        icon: Coins,
        route: ROUTERS.ADMIN.SUBSCRIPTION_PLANS,
      },
      {
        key: "settings",
        title: "Settings",
        subtitle: "Cấu hình hệ thống",
        icon: Settings,
        route: ROUTERS.ADMIN.SETTINGS,
      },
    ],
    []
  );

  return (
    <div className="space-y-6 relative">
      {toastMsg && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}

      <div className="mx-auto w-full max-w-[980px]">
        <div className="w-full rounded-2xl border border-white/10 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-2xl">
          <div className="flex items-center gap-6 px-6 py-6">
            <div className="h-[120px] w-[120px] rounded-xl border-2 border-dashed border-white/20 bg-white/10 flex items-center justify-center">
              <div className="text-5xl">📊</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-extrabold mb-1">
                Bảng điều khiển Admin
              </div>
              <div className="opacity-90">
                Tổng quan và truy cập nhanh các khu vực quản trị
              </div>
            </div>
            <div className="text-sm opacity-80">
              🕒 Cập nhật lúc: <b>{lastUpdated}</b>
              <div className="text-xs mt-1">
                Cảnh báo đang mở: <b>{alertsCount}</b>
              </div>
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
                loading
                  ? "bg-white/10 cursor-not-allowed opacity-70"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>
      </div>

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
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {c.subtitle}
                </div>
              </div>
            </div>
            <div className="text-xl font-bold text-blue-600 transition-transform group-hover:translate-x-1">
              →
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Người dùng"
          value={
            loading ? "..." : kpis.users?.toLocaleString?.("vi-VN") ?? "0"
          }
          icon={Users}
        />
        <StatCard
          title="Doanh thu (tháng)"
          value={loading ? "..." : formatVND(kpis.revenue)}
          icon={CreditCard}
        />
        <StatCard
          title="Phiên sạc (tháng)"
          value={
            loading ? "..." : kpis.sessions?.toLocaleString?.("vi-VN") ?? "0"
          }
          icon={PlugZap}
        />
      </div>

      <Section title="Tổng quan tháng này">
        <Chart height={260} data={monthlyChart} />
        <div className="text-xs text-gray-500 mt-2 text-right">
          Lần cập nhật cuối: {lastUpdated}
        </div>
      </Section>
    </div>
  );
}
