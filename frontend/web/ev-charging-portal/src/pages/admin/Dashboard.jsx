import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import apiClient from "@/api/apiClient";

// Dashboard tổng quan cho admin
// - Lấy health hệ thống
// - Lấy doanh thu 30 ngày gần nhất
// - Lấy thống kê station / session / user
export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [error, setError] = useState("");

  // Gọi API song song khi vào trang
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

        setHealth(healthRes.data);
        setSummary(summaryRes.data);

        const daily = revenueRes.data?.daily || [];
        // Chuẩn hoá data cho Chart: [{label, value}]
        setRevenueSeries(
          daily.map((d) => ({
            label: d.date, // "2025-10-01"
            value: Number(d.revenue || d.total || 0),
          }))
        );
      } catch (err) {
        console.error("[AdminDashboard] error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải dữ liệu dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Tổng quan hệ thống sạc, doanh thu và sức khoẻ dịch vụ."
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Hàng 1: Health + Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Section title="System Health">
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Auth:</span>{" "}
                <span
                  className={
                    health?.services?.auth === "ok"
                      ? "text-emerald-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {health?.services?.auth || "unknown"}
                </span>
              </p>
              <p>
                <span className="font-semibold">DBs:</span>{" "}
                <span
                  className={
                    health?.services?.db === "ok"
                      ? "text-emerald-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {health?.services?.db || "unknown"}
                </span>
              </p>
              <p>
                <span className="font-semibold">Payment:</span>{" "}
                <span
                  className={
                    health?.payment === "ok"
                      ? "text-emerald-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {health?.payment || "unknown"}
                </span>
              </p>
            </div>
          </Section>

          <Section title="Tổng quan trạm / phiên">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-lg shadow-sm border px-3 py-3">
                <div className="text-xs text-slate-500">Số trạm</div>
                <div className="text-xl font-bold">
                  {summary?.stations_total ?? "--"}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border px-3 py-3">
                <div className="text-xs text-slate-500">Phiên đang chạy</div>
                <div className="text-xl font-bold">
                  {summary?.sessions_active ?? "--"}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border px-3 py-3">
                <div className="text-xs text-slate-500">Người dùng</div>
                <div className="text-xl font-bold">
                  {summary?.users_total ?? "--"}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border px-3 py-3">
                <div className="text-xs text-slate-500">Doanh thu hôm nay</div>
                <div className="text-xl font-bold text-emerald-600">
                  {summary?.revenue_today?.toLocaleString("vi-VN") || 0} đ
                </div>
              </div>
            </div>
          </Section>

          <Section title="Trạng thái tải dữ liệu">
            <div className="flex items-center gap-2 text-sm">
              {loading ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Đang tải dữ liệu từ API…</span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Dữ liệu đã được cập nhật từ backend.</span>
                </>
              )}
            </div>
          </Section>
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
