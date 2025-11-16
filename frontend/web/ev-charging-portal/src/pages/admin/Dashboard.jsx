// pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import paymentService from "@/services/paymentService";
import apiClient from "@/api/apiClient";

/**
 * 🔹 Card nhỏ hiển thị số liệu tổng quan
 */
function StatCard({ label, value, unit, loading }) {
  const formatNumber = (num) =>
    num !== null && num !== undefined
      ? Number(num).toLocaleString("vi-VN")
      : "--";

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      {loading ? (
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
      ) : (
        <span className="text-2xl font-semibold">
          {formatNumber(value)}
          {unit ? <span className="text-base text-gray-500 ml-1">{unit}</span> : null}
        </span>
      )}
    </div>
  );
}

/**
 * Lấy token từ localStorage / cookie
 */
function getStoredToken() {
  if (typeof window === "undefined") return null;
  const keys = ["access_token", "token", "authToken", "Authorization"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  const cookieMatch = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find(
      (c) =>
        c.startsWith("access_token=") ||
        c.startsWith("token=") ||
        c.startsWith("authToken=")
    );
  if (cookieMatch) {
    const [, cookieVal] = cookieMatch.split("=");
    return cookieVal;
  }
  return null;
}

/**
 * Cố gắng set header Authorization trên apiClient nếu có
 */
function setAuthHeaderOnApiClient(token) {
  if (!token || !apiClient) return;
  try {
    if (apiClient.defaults && apiClient.defaults.headers) {
      if (apiClient.defaults.headers.common) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      } else {
        apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    console.debug("Cannot set auth header on apiClient:", e);
  }
}

export default function Dashboard() {
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [dailyList, setDailyList] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [health, setHealth] = useState(null);

  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingDailyList, setLoadingDailyList] = useState(false);
  const [loadingMonthlyList, setLoadingMonthlyList] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const [error, setError] = useState("");

  // =========================
  // 1. Daily Revenue
  // =========================
  useEffect(() => {
    let isMounted = true;

    async function fetchDailyRevenue() {
      try {
        setLoadingChart(true);
        setLoadingDailyList(true);
        setError("");

        const token = getStoredToken();
        setAuthHeaderOnApiClient(token);

        const res = await paymentService.getDailyRevenue();
        if (!isMounted) return;

        const daily = res?.data ?? res;
        const arr = Array.isArray(daily) ? daily : [];

        setDailyRevenue(arr);
        setDailyList(arr);
      } catch (err) {
        console.error("Daily revenue error:", err);
        if (!isMounted) return;
        setError("Không tải được biểu đồ doanh thu.");
        setDailyRevenue([]);
        setDailyList([]);
      } finally {
        if (isMounted) {
          setLoadingChart(false);
          setLoadingDailyList(false);
        }
      }
    }

    fetchDailyRevenue();
    return () => (isMounted = false);
  }, []);

  // =========================
  // 2. Monthly Revenue
  // =========================
  useEffect(() => {
    let isMounted = true;

    async function fetchMonthlyRevenue() {
      try {
        setLoadingMonthlyList(true);
        setError("");

        const token = getStoredToken();
        setAuthHeaderOnApiClient(token);

        const res = await paymentService.getMonthlyRevenue();
        if (!isMounted) return;

        const payload = res?.data ?? res;
        const arr = Array.isArray(payload) ? payload : [];

        setMonthlyRevenue(arr);
      } catch (err) {
        console.error("Monthly revenue error:", err);
        if (!isMounted) return;
        setError("Không tải được doanh thu theo tháng.");
        setMonthlyRevenue([]);
      } finally {
        if (isMounted) setLoadingMonthlyList(false);
      }
    }

    fetchMonthlyRevenue();
    return () => (isMounted = false);
  }, []);

  // =========================
  // 3. System Health
  // =========================
  useEffect(() => {
    let isMounted = true;

    async function fetchHealth() {
      try {
        setLoadingHealth(true);
        const token = getStoredToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await fetch("/api/v1/monitoring/health", { headers });
        if (!isMounted) return;
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const json = await res.json();
        setHealth(json || null);
      } catch (err) {
        console.error("Health error:", err);
        if (!isMounted) return;
        setHealth(null);
      } finally {
        if (isMounted) setLoadingHealth(false);
      }
    }

    fetchHealth();
    const intervalId = setInterval(fetchHealth, 60000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // =========================
  // Derived values
  // =========================
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const revenueToday = dailyRevenue.find((d) => d.date === todayStr)?.total ?? 0;
  const revenueMonth = dailyRevenue.reduce((sum, d) => sum + Number(d.total ?? 0), 0);

  // Các thông số tạm nếu không có summary
  const totalUsers = 0;
  const totalStations = 0;
  const activeSessions = 0;

  const systemStatus = health?.status || health?.overall_status || "unknown";
  const isSystemOk =
    systemStatus === "ok" || systemStatus === "healthy" || systemStatus === "UP";

  const formatDate = (dStr) => {
    if (!dStr) return dStr;
    if (/^\d{4}-\d{2}$/.test(dStr)) {
      const [y, m] = dStr.split("-");
      return `${m}/${y}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(dStr)) {
      const dt = new Date(dStr + "T00:00:00Z");
      if (isNaN(dt)) return dStr;
      return dt.toLocaleDateString("vi-VN");
    }
    return dStr;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan hoạt động hệ thống trạm sạc EV"
      />

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Thống kê nhanh */}
      <Section title="Thống kê nhanh">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard label="Doanh thu hôm nay" value={revenueToday} unit="VND" loading={loadingChart} />
          <StatCard label="Doanh thu tháng này" value={revenueMonth} unit="VND" loading={loadingChart} />
          <StatCard label="Tổng người dùng" value={totalUsers} loading={false} />
          <StatCard label="Số trạm đang hoạt động" value={totalStations} loading={false} />
          <StatCard label="Phiên sạc đang diễn ra" value={activeSessions} loading={false} />
        </div>
      </Section>

      {/* Biểu đồ daily */}
      <Section title="Biểu đồ doanh thu 30 ngày gần nhất">
        {loadingChart ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : dailyRevenue.length === 0 ? (
          <div className="text-sm text-gray-500">Chưa có dữ liệu doanh thu để hiển thị.</div>
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

      {/* Daily List */}
      <Section title="Danh sách doanh thu theo ngày (30 ngày)">
        {loadingDailyList ? (
          <div className="h-40 bg-gray-100 animate-pulse rounded-xl" />
        ) : dailyList.length === 0 ? (
          <div className="text-sm text-gray-500">Không có dữ liệu.</div>
        ) : (
          <div className="overflow-auto bg-white rounded-xl shadow-sm p-4">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2">Ngày</th>
                  <th className="py-2">Doanh thu (VND)</th>
                </tr>
              </thead>
              <tbody>
                {dailyList.map((row) => (
                  <tr key={row.date} className="border-t last:border-b">
                    <td className="py-2">{formatDate(row.date)}</td>
                    <td className="py-2 font-medium">
                      {Number(row.total ?? 0).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Monthly List */}
      <Section title="Doanh thu theo tháng (12 tháng gần nhất)">
        {loadingMonthlyList ? (
          <div className="h-40 bg-gray-100 animate-pulse rounded-xl" />
        ) : monthlyRevenue.length === 0 ? (
          <div className="text-sm text-gray-500">Không có dữ liệu doanh thu theo tháng.</div>
        ) : (
          <div className="overflow-auto bg-white rounded-xl shadow-sm p-4">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2">Tháng</th>
                  <th className="py-2">Doanh thu (VND)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRevenue.map((row, idx) => {
                  const key = row.month ?? String(idx);
                  return (
                    <tr key={key} className="border-t last:border-b">
                      <td className="py-2">{formatDate(row.month)}</td>
                      <td className="py-2 font-medium">
                        {Number(row.total ?? 0).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* System Health */}
      <Section title="Trạng thái hệ thống">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Tình trạng chung</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isSystemOk ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {loadingHealth ? "Đang kiểm tra..." : isSystemOk ? "Hoạt động ổn định" : "Có cảnh báo"}
              </span>
            </div>
            <pre className="mt-2 bg-gray-50 text-xs text-gray-700 rounded-lg p-3 max-h-40 overflow-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>
        </div>
      </Section>
    </div>
  );
}
