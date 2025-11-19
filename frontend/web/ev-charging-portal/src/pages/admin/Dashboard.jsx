// pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import paymentService from "@/services/paymentService";
import apiClient from "@/api/apiClient";

/* --------------------------- Stat Cards --------------------------- */
function StatCard({ label, value, unit, loading }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      {loading ? (
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
      ) : (
        <span className="text-2xl font-semibold">
          {value?.toLocaleString("vi-VN") ?? "--"}
          {unit ? <span className="text-base text-gray-500 ml-1">{unit}</span> : null}
        </span>
      )}
    </div>
  );
}

/* --------------------------- token helpers --------------------------- */
function getStoredToken() {
  if (typeof window === "undefined") return null;
  const keys = ["access_token", "token", "authToken"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

function setAuthHeaderOnApiClient(token) {
  if (!token || !apiClient) return;
  try {
    if (apiClient.defaults?.headers?.common) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  } catch {}
}

export default function Dashboard() {
  /* --------------------------- STATES --------------------------- */
  const [summary, setSummary] = useState(null);

  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [dailyList, setDailyList] = useState([]);

  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

  const [health, setHealth] = useState(null);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingDailyList, setLoadingDailyList] = useState(false);
  const [loadingMonthlyList, setLoadingMonthlyList] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const [error, setError] = useState("");

  /* --------------------------- 1. Summary --------------------------- */
  useEffect(() => {
    let mounted = true;

    async function fetchSummary() {
      try {
        setLoadingSummary(true);
        const token = getStoredToken();

        const res = await fetch("/api/v1/analytics/admin/summary", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!mounted) return;
        if (!res.ok) throw new Error("Fetch summary failed");

        const json = await res.json();
        setSummary(json || null);
      } catch (err) {
        setError("Không tải được dữ liệu tổng quan.");
        setSummary(null);
      } finally {
        if (mounted) setLoadingSummary(false);
      }
    }

    fetchSummary();
    return () => (mounted = false);
  }, []);

  /* --------------------------- 2. DAILY revenue --------------------------- */
  useEffect(() => {
    let mounted = true;

    async function fetchDailyRevenue() {
      try {
        setLoadingChart(true);
        setLoadingDailyList(true);

        const token = getStoredToken();
        setAuthHeaderOnApiClient(token);

        const res = await paymentService.getDailyRevenue();
        if (!mounted) return;

        const payload = res?.data ?? res;

        // 🔥 Convert incoming object → array
        const raw = payload?.daily_revenue ?? {};
        const arr = Object.entries(raw).map(([date, total]) => ({
          date,
          total,
        }));

        // sort theo date
        arr.sort((a, b) => new Date(a.date) - new Date(b.date));

        setDailyRevenue(arr);
        setDailyList(arr);
      } catch (err) {
        setDailyRevenue([]);
        setDailyList([]);
      } finally {
        if (mounted) {
          setLoadingChart(false);
          setLoadingDailyList(false);
        }
      }
    }

    fetchDailyRevenue();
    return () => (mounted = false);
  }, []);

  /* --------------------------- 3. MONTHLY revenue --------------------------- */
  useEffect(() => {
    let mounted = true;

    async function fetchMonthlyRevenue() {
      try {
        setLoadingMonthlyList(true);

        const token = getStoredToken();
        setAuthHeaderOnApiClient(token);

        const res = await paymentService.getMonthlyRevenue();
        if (!mounted) return;

        const payload = res?.data ?? res;

        // 🔥 Convert incoming object → array
        const raw = payload?.monthly_revenue ?? {};
        const arr = Object.entries(raw).map(([month, total]) => ({
          month,
          total,
        }));

        // sort theo month
        arr.sort((a, b) => a.month.localeCompare(b.month));

        setMonthlyRevenue(arr);
      } catch (err) {
        setMonthlyRevenue([]);
      } finally {
        if (mounted) setLoadingMonthlyList(false);
      }
    }

    fetchMonthlyRevenue();
    return () => (mounted = false);
  }, []);

  /* --------------------------- 4. HEALTH --------------------------- */
  useEffect(() => {
    let mounted = true;

    async function fetchHealth() {
      try {
        setLoadingHealth(true);
        const token = getStoredToken();

        const res = await fetch("/api/v1/monitoring/health", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!mounted) return;
        if (!res.ok) throw new Error();

        const json = await res.json();
        setHealth(json);
      } catch {
        setHealth(null);
      } finally {
        if (mounted) setLoadingHealth(false);
      }
    }

    fetchHealth();
    const id = setInterval(fetchHealth, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  /* --------------------------- Utils --------------------------- */
  const formatDate = (dStr) => {
    if (!dStr) return dStr;
    if (/^\d{4}-\d{2}$/.test(dStr)) {
      const [y, m] = dStr.split("-");
      return `${m}/${y}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      const d = new Date(dStr);
      return d.toLocaleDateString("vi-VN");
    }
    return dStr;
  };

  /* --------------------------- Derived --------------------------- */
  const revenueToday = summary?.revenue_today ?? 0;
  const revenueMonth = summary?.revenue_month ?? 0;
  const totalUsers = summary?.total_users ?? 0;
  const totalStations = summary?.total_stations ?? 0;
  const activeSessions = summary?.active_sessions ?? 0;

  const systemStatus = health?.status || "unknown";
  const isSystemOk = ["ok", "UP", "healthy"].includes(systemStatus);

  /* --------------------------- RENDER --------------------------- */
  return (
    <div className="space-y-6">
      <PageHeader title="Bảng điều khiển" subtitle="Tổng quan hệ thống trạm sạc EV" />

      {error && <div className="bg-red-100 p-3 text-red-700 rounded">{error}</div>}

      {/* ---------- QUICK STATS ---------- */}
      <Section title="Thống kê nhanh">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard label="Doanh thu hôm nay" value={revenueToday} unit="VND" loading={loadingSummary} />
          <StatCard label="Doanh thu tháng này" value={revenueMonth} unit="VND" loading={loadingSummary} />
          <StatCard label="Tổng người dùng" value={totalUsers} loading={loadingSummary} />
          <StatCard label="Số trạm" value={totalStations} loading={loadingSummary} />
          <StatCard label="Phiên sạc đang diễn ra" value={activeSessions} loading={loadingSummary} />
        </div>
      </Section>

      {/* ---------- DAILY CHART ---------- */}
      <Section title="Biểu đồ doanh thu 30 ngày gần nhất">
        {loadingChart ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : dailyRevenue.length === 0 ? (
          <div className="text-sm text-gray-500">Không có dữ liệu.</div>
        ) : (
          <Chart
            type="line"
            data={dailyRevenue}
            xKey="date"
            yKey="total"
            height={260}
            label="Doanh thu (VND)"
          />
        )}
      </Section>

      {/* ---------- DAILY LIST ---------- */}
      <Section title="Doanh thu theo ngày">
        {loadingDailyList ? (
          <div className="h-40 bg-gray-100 animate-pulse rounded-xl" />
        ) : (
          <div className="overflow-auto bg-white rounded-xl shadow-sm p-4">
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-2">Ngày</th>
                  <th className="py-2">Doanh thu (VND)</th>
                </tr>
              </thead>
              <tbody>
                {dailyList.map((row) => (
                  <tr key={row.date} className="border-t">
                    <td className="py-2">{formatDate(row.date)}</td>
                    <td className="py-2 font-medium">{row.total.toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ---------- MONTHLY LIST ---------- */}
      <Section title="Doanh thu theo tháng (12 tháng)">
        {loadingMonthlyList ? (
          <div className="h-40 bg-gray-100 animate-pulse rounded-xl" />
        ) : (
          <div className="overflow-auto bg-white rounded-xl shadow-sm p-4">
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-2">Tháng</th>
                  <th className="py-2">Doanh thu (VND)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRevenue.map((row) => (
                  <tr key={row.month} className="border-t">
                    <td className="py-2">{formatDate(row.month)}</td>
                    <td className="py-2 font-medium">{row.total.toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ---------- HEALTH ---------- */}
      <Section title="Trạng thái hệ thống">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Tình trạng chung</span>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                isSystemOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {loadingHealth ? "Đang kiểm tra..." : isSystemOk ? "Hoạt động ổn định" : "Có cảnh báo"}
            </span>
          </div>
          <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-40">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      </Section>
    </div>
  );
}
