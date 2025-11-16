import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import paymentService from "@/services/paymentService";
import apiClient from "@/api/apiClient"; // để cố gắng set header nếu apiClient là axios

/**
 * 🔹 Card nhỏ hiển thị số liệu tổng quan
 */
function StatCard({ label, value, unit, loading }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      {loading ? (
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
      ) : (
        <span className="text-2xl font-semibold">
          {value !== null && value !== undefined ? value.toLocaleString("vi-VN") : "--"}
          {unit ? <span className="text-base text-gray-500 ml-1">{unit}</span> : null}
        </span>
      )}
    </div>
  );
}

/**
 * Lấy token từ localStorage / cookie (thử các key phổ biến).
 * Nếu dự án bạn lưu token ở nơi khác, đổi hàm này tương ứng.
 */
function getStoredToken() {
  if (typeof window === "undefined") return null;
  const keys = ["access_token", "token", "authToken", "Authorization"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  // try cookie (simple parse)
  const cookieMatch = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("access_token=") || c.startsWith("token=") || c.startsWith("authToken="));
  if (cookieMatch) {
    const [, cookieVal] = cookieMatch.split("=");
    return cookieVal;
  }
  return null;
}

/**
 * Cố gắng set header Authorization trên apiClient nếu có (ví dụ axios instance).
 * Nếu apiClient không có cấu trúc đó, chỉ bỏ qua (paymentService có thể tự xử lý).
 */
function setAuthHeaderOnApiClient(token) {
  if (!token || !apiClient) return;
  try {
    // axios instance common pattern
    if (apiClient.defaults && apiClient.defaults.headers) {
      // axios: apiClient.defaults.headers.common.Authorization
      if (apiClient.defaults.headers.common) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      } else {
        // fallback
        apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      }
      return;
    }

    // some projects export a function that accepts config - can't set global header
    // so do nothing in that case
  } catch (e) {
    // ignore
    // console.debug("Cannot set auth header on apiClient:", e);
  }
}

export default function Dashboard() {
  // 🔹 State lưu dữ liệu tổng quan & biểu đồ & lists
  const [summary, setSummary] = useState(null);

  // revenue
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [dailyList, setDailyList] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

  const [health, setHealth] = useState(null);

  // loading flags
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingDailyList, setLoadingDailyList] = useState(false);
  const [loadingMonthlyList, setLoadingMonthlyList] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const [error, setError] = useState("");

  // =========================
  // 1. API tổng quan admin (fetch + Authorization header)
  // =========================
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        // 1) Health tổng thể
        // GET /api/v1/monitoring/health
        const [healthRes, summaryRes, revenueRes] = await Promise.all([
          apiClient.get("/api/v1/monitoring/health"),
          // 2) Tổng quan analytics (tuỳ backend bạn, có thể đổi URL)
          apiClient.get("/api/v1/analytics/summary"),
          // 3) Doanh thu 30 ngày gần nhất
          // GET /api/v1/analytics/reports/revenue?days=30
          apiClient.get("/api/v1/analytics/reports/revenue", {
            params: { days: 30 },
          }),
        ]);

        const token = getStoredToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await fetch("/api/v1/analytics/admin/summary", { headers });
        if (!isMounted) return;
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const json = await res.json();
        setSummary(json || null);
      } catch (err) {
        console.error("Dashboard summary error:", err);
        if (!isMounted) return;
        setError("Không tải được dữ liệu tổng quan.");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // =========================
  // 2. Daily Revenue (Không params) - đảm bảo đặt header trước khi gọi paymentService
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

        // Nếu paymentService dùng apiClient (axios), header đã được gắn.
        // Nếu không, bạn có thể cập nhật paymentService để nhận headers.
        const res = await paymentService.getDailyRevenue();
        if (!isMounted) return;

        const daily = res?.data ?? res;
        const arr = Array.isArray(daily) ? daily : [];

        setDailyRevenue(arr);
        setDailyList(arr);
      } catch (err) {
        console.error("Daily revenue error:", err);
        if (!isMounted) return;
        setError((prev) => prev || "Không tải được biểu đồ doanh thu.");
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
  // 3. Monthly Revenue (Không params) - đảm bảo đặt header
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
        setError((prev) => prev || "Không tải được doanh thu theo tháng.");
        setMonthlyRevenue([]);
      } finally {
        if (isMounted) setLoadingMonthlyList(false);
      }
    }

    fetchMonthlyRevenue();
    return () => (isMounted = false);
  }, []);

  // =========================
  // 4. System Health (fetch + Authorization header)
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
  const revenueToday = summary?.revenue_today ?? 0;
  const revenueMonth = summary?.revenue_month ?? 0;
  const totalUsers = summary?.total_users ?? 0;
  const totalStations = summary?.total_stations ?? 0;
  const activeSessions = summary?.active_sessions ?? 0;

  const systemStatus = health?.status || health?.overall_status || "unknown";
  const isSystemOk =
    systemStatus === "ok" || systemStatus === "healthy" || systemStatus === "UP";

  const formatDate = (dStr) => {
    if (!dStr) return dStr;

    if (/^\d{4}-\d{2}$/.test(dStr)) {
      const [y, m] = dStr.split("-");
      return `${m}/${y}`;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      const dt = new Date(dStr + "T00:00:00Z");
      if (isNaN(dt)) return dStr;
      return dt.toLocaleDateString("vi-VN");
    }

    return dStr;
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Tổng quan hệ thống sạc, doanh thu và sức khoẻ dịch vụ."
        />

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ===== Hàng 1: Thống kê nhanh ===== */}
      <Section title="Thống kê nhanh">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard label="Doanh thu hôm nay" value={revenueToday} unit="VND" loading={loadingSummary} />
          <StatCard label="Doanh thu tháng này" value={revenueMonth} unit="VND" loading={loadingSummary} />
          <StatCard label="Tổng người dùng" value={totalUsers} loading={loadingSummary} />
          <StatCard label="Số trạm đang hoạt động" value={totalStations} loading={loadingSummary} />
          <StatCard label="Phiên sạc đang diễn ra" value={activeSessions} loading={loadingSummary} />
        </div>
      </Section>

      {/* ===== Hàng 2: Biểu đồ doanh thu 30 ngày ===== */}
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
            yKey="total_revenue"
            height={260}
            label="Doanh thu (VND)"
          />
        )}

      {/* ===== Hàng 3: Daily List ===== */}
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
                      {(row.total?? 0).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ===== Hàng 4: Monthly List ===== */}
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
                  const key = row.month ?? row.date ?? String(idx);
                  const label = row.month ?? row.date ?? "";
                  return (
                    <tr key={key} className="border-t last:border-b">
                      <td className="py-2">{formatDate(label)}</td>
                      <td className="py-2 font-medium">
                        {(row.total ?? 0).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ===== Hàng 5: System Health ===== */}
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

        {/* Hàng 2: Biểu đồ doanh thu */}
        <Section title="Doanh thu 30 ngày gần nhất">
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <Chart
              type="line"
              data={revenueSeries}
              xKey="label"
              yKey="value"
              height={260}
              tooltipLabel="Ngày"
              tooltipValue="Doanh thu (VND)"
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
