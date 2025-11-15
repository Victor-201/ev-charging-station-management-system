// pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import apiClient from "@/api/apiClient";

// 🔹 Card nhỏ hiển thị số liệu tổng quan
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

export default function Dashboard() {
  // 🔹 State lưu dữ liệu tổng quan & biểu đồ
  const [summary, setSummary] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [health, setHealth] = useState(null);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const [error, setError] = useState("");

  // =========================
  // 1. Gọi API tổng quan doanh thu / user / trạm
  // =========================
  useEffect(() => {
    let isMounted = true;

    async function fetchSummary() {
      try {
        setLoadingSummary(true);
        setError("");

        // 👉 API gợi ý: backend trả tổng quan admin (doanh thu, user, trạm,…)
        const res = await apiClient({
          method: "GET",
          url: "/api/v1/analytics/admin/summary",
        });

        if (!isMounted) return;
        setSummary(res.data || null);
      } catch (err) {
        console.error("Dashboard summary error:", err);
        if (!isMounted) return;
        setError("Không tải được dữ liệu tổng quan.");
      } finally {
        if (isMounted) setLoadingSummary(false);
      }
    }

    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  // =========================
  // 2. Gọi API doanh thu theo ngày (30 ngày gần nhất)
  // =========================
  useEffect(() => {
    let isMounted = true;

    async function fetchDailyRevenue() {
      try {
        setLoadingChart(true);
        setError("");

        // 👉 API gợi ý: trả list { date, total_revenue }
        const res = await apiClient({
          method: "GET",
          url: "/api/v1/payments/revenue/daily?days=30",
        });

        if (!isMounted) return;
        setDailyRevenue(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Daily revenue error:", err);
        if (!isMounted) return;
        setError((prev) => prev || "Không tải được biểu đồ doanh thu.");
      } finally {
        if (isMounted) setLoadingChart(false);
      }
    }

    fetchDailyRevenue();
    return () => {
      isMounted = false;
    };
  }, []);

  // =========================
  // 3. Gọi API health hệ thống
  // =========================
  useEffect(() => {
    let isMounted = true;

    async function fetchHealth() {
      try {
        setLoadingHealth(true);
        const res = await apiClient({
          method: "GET",
          url: "/api/v1/monitoring/health",
        });
        if (!isMounted) return;
        setHealth(res.data || null);
      } catch (err) {
        console.error("Health error:", err);
      } finally {
        if (isMounted) setLoadingHealth(false);
      }
    }

    fetchHealth();
    // Có thể setup interval nếu muốn realtime
    const intervalId = setInterval(fetchHealth, 60_000); // 60s
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const revenueToday = summary?.revenue_today ?? 0;
  const revenueMonth = summary?.revenue_month ?? 0;
  const totalUsers = summary?.total_users ?? 0;
  const totalStations = summary?.total_stations ?? 0;
  const activeSessions = summary?.active_sessions ?? 0;

  const systemStatus =
    health?.status || health?.overall_status || "unknown";

  const isSystemOk =
    systemStatus === "ok" ||
    systemStatus === "healthy" ||
    systemStatus === "UP";

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

      {/* ===== Hàng 1: Thống kê nhanh ===== */}
      <Section title="Thống kê nhanh">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            label="Doanh thu hôm nay"
            value={revenueToday}
            unit="VND"
            loading={loadingSummary}
          />
          <StatCard
            label="Doanh thu tháng này"
            value={revenueMonth}
            unit="VND"
            loading={loadingSummary}
          />
          <StatCard
            label="Tổng người dùng"
            value={totalUsers}
            loading={loadingSummary}
          />
          <StatCard
            label="Số trạm đang hoạt động"
            value={totalStations}
            loading={loadingSummary}
          />
          <StatCard
            label="Phiên sạc đang diễn ra"
            value={activeSessions}
            loading={loadingSummary}
          />
        </div>
      </Section>

      {/* ===== Hàng 2: Biểu đồ doanh thu ===== */}
      <Section title="Biểu đồ doanh thu 30 ngày gần nhất">
        {loadingChart ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : dailyRevenue.length === 0 ? (
          <div className="text-sm text-gray-500">
            Chưa có dữ liệu doanh thu để hiển thị.
          </div>
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
      </Section>

      {/* ===== Hàng 3: Trạng thái hệ thống ===== */}
      <Section title="Trạng thái hệ thống">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                Tình trạng chung
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isSystemOk
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {loadingHealth
                  ? "Đang kiểm tra..."
                  : isSystemOk
                  ? "Hoạt động ổn định"
                  : "Có cảnh báo"}
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
