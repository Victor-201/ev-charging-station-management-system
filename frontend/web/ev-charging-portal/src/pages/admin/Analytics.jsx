import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import Table from "@/components/admin/Table";
import apiClient from "@/api/apiClient";

// Trang Analytics cho admin
// - Monitoring: metrics, logs, alerts
// - Analytics: báo cáo user / station / revenue
export default function Analytics() {
  const [activeTab, setActiveTab] = useState("monitoring");

  // Monitoring state
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Analytics state
  const [userReport, setUserReport] = useState(null);
  const [stationDaily, setStationDaily] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState(null);

  const [filters, setFilters] = useState({
    userId: "",
    stationId: "",
    month: "2025-10",
    date: "2025-10-01",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== MONITORING =====
  const loadMonitoring = async () => {
    setLoading(true);
    setError("");
    try {
      // 1) Metrics (Prometheus-like)
      // GET /api/v1/monitoring/metrics
      const metricsRes = await apiClient.get("/api/v1/monitoring/metrics", {
        params: { metric: "requests_per_sec", from: "-1h", to: "now", step: "60s" },
      });

      // 2) Logs (ELK)
      // GET /api/v1/monitoring/logs
      const logsRes = await apiClient.get("/api/v1/monitoring/logs", {
        params: {
          q: "error OR warn",
          from: "-1h",
          to: "now",
          level: "error",
          page: 1,
          pageSize: 20,
        },
      });

      // 3) Alerts
      // GET /api/v1/monitoring/alerts
      const alertsRes = await apiClient.get("/api/v1/monitoring/alerts");

      setMetrics(metricsRes.data);
      setLogs(logsRes.data?.items || logsRes.data || []);
      setAlerts(alertsRes.data?.alerts || alertsRes.data || []);
    } catch (err) {
      console.error("[Analytics] monitoring error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải dữ liệu monitoring."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAckAlert = async (alertId) => {
    try {
      // POST /api/v1/monitoring/alerts/ack
      await apiClient.post("/api/v1/monitoring/alerts/ack", {
        alert_id: alertId,
        user_id: "admin", // tuỳ backend
      });
      // refresh alert list
      await loadMonitoring();
    } catch (err) {
      console.error("ack alert error:", err);
      alert(
        err?.response?.data?.message ||
          "Không thể ack alert, vui lòng thử lại sau."
      );
    }
  };

  // ===== ANALYTICS =====
  const loadAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const [userRes, stationRes, revenueRes] = await Promise.all([
        // GET /api/v1/analytics/reports/user/{user_id}/monthly
        filters.userId
          ? apiClient.get(
              `/api/v1/analytics/reports/user/${filters.userId}/monthly`,
              {
                params: { month: filters.month },
              }
            )
          : Promise.resolve({ data: null }),
        // GET /api/v1/analytics/reports/station/{station_id}/daily
        filters.stationId
          ? apiClient.get(
              `/api/v1/analytics/reports/station/${filters.stationId}/daily`,
              {
                params: { date: filters.date },
              }
            )
          : Promise.resolve({ data: { sessions: [] } }),
        // GET /api/v1/analytics/reports/revenue
        apiClient.get("/api/v1/analytics/reports/revenue", {
          params: {
            station_id: filters.stationId || undefined,
            from: `${filters.month}-01`,
            to: `${filters.month}-31`,
            group_by: "day",
          },
        }),
      ]);

      setUserReport(userRes.data);
      setStationDaily(stationRes.data?.sessions || []);
      setRevenueSummary(revenueRes.data);
    } catch (err) {
      console.error("[Analytics] analytics error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải dữ liệu analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "monitoring") {
      loadMonitoring();
    } else {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // đổi filter nhưng không auto gọi API – để user bấm nút "Lấy dữ liệu"
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const revenueSeries =
    revenueSummary?.items?.map((d) => ({
      label: d.date,
      value: Number(d.total_revenue || 0),
    })) || [];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Monitoring & Analytics"
          subtitle="Giám sát health, logs, alerts và báo cáo chi phí / doanh thu."
        />

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: "monitoring", label: "Monitoring" },
            { key: "analytics", label: "Analytics" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {activeTab === "monitoring" ? (
          <>
            {/* Metrics */}
            <Section title="Metrics (Prometheus-like)">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <Chart
                  type="line"
                  data={
                    metrics?.series?.map((p) => ({
                      label: p.timestamp,
                      value: Number(p.value),
                    })) || []
                  }
                  xKey="label"
                  yKey="value"
                  height={260}
                  tooltipLabel="Thời gian"
                  tooltipValue="Requests / sec"
                />
              </div>
            </Section>

            {/* Logs + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Logs gần đây (ELK)">
                <Table
                  columns={["Time", "Service", "Level", "Message"]}
                  rows={logs.map((log) => [
                    log.timestamp,
                    log.service,
                    log.level,
                    log.message,
                  ])}
                />
              </Section>

              <Section title="Alerts hiện tại">
                {alerts.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Không có alert nào đang firing.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((a) => (
                      <div
                        key={a.id}
                        className="border rounded-lg bg-white px-3 py-2 flex items-center justify-between gap-3"
                      >
                        <div className="text-sm">
                          <div className="font-semibold">
                            [{a.type}] {a.summary}
                          </div>
                          <div className="text-xs text-slate-500">
                            status: {a.status} • since: {a.startsAt}
                          </div>
                        </div>
                        {a.status !== "acknowledged" && (
                          <button
                            onClick={() => handleAckAlert(a.id)}
                            className="text-xs px-3 py-1 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                          >
                            ACK
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </>
        ) : (
          <>
            {/* Bộ lọc analytics */}
            <Section title="Bộ lọc báo cáo">
              <div className="bg-white rounded-xl border shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    User ID (báo cáo tháng)
                  </label>
                  <input
                    value={filters.userId}
                    onChange={(e) =>
                      handleFilterChange("userId", e.target.value)
                    }
                    placeholder="UUID hoặc mã user"
                    className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Station ID (báo cáo ngày)
                  </label>
                  <input
                    value={filters.stationId}
                    onChange={(e) =>
                      handleFilterChange("stationId", e.target.value)
                    }
                    placeholder="UUID trạm"
                    className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Tháng (yyyy-MM)
                  </label>
                  <input
                    type="month"
                    value={filters.month}
                    onChange={(e) =>
                      handleFilterChange("month", e.target.value)
                    }
                    className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Ngày (yyyy-MM-dd)
                  </label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) =>
                      handleFilterChange("date", e.target.value)
                    }
                    className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="md:col-span-4 flex justify-end items-end">
                  <button
                    onClick={loadAnalytics}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loading ? "Đang tải..." : "Lấy dữ liệu báo cáo"}
                  </button>
                </div>
              </div>
            </Section>

            {/* User monthly */}
            <Section title="Báo cáo tháng theo User">
              {userReport ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">
                      Tổng số phiên
                    </div>
                    <div className="text-2xl font-bold">
                      {userReport.total_sessions}
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">
                      Tổng kWh sử dụng
                    </div>
                    <div className="text-2xl font-bold">
                      {userReport.total_kwh}
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">
                      Tổng chi phí
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {userReport.total_cost?.toLocaleString("vi-VN") || 0} đ
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Nhập User ID và bấm &quot;Lấy dữ liệu&quot; để xem báo cáo.
                </p>
              )}
            </Section>

            {/* Station daily sessions */}
            <Section title="Phiên trong ngày theo trạm">
              <Table
                columns={[
                  "Session ID",
                  "User",
                  "Bắt đầu",
                  "KWh",
                  "Chi phí (đ)",
                  "Trạng thái",
                ]}
                rows={stationDaily.map((s) => [
                  s.id,
                  s.user_id,
                  s.start_time,
                  s.energy_kwh,
                  s.cost?.toLocaleString("vi-VN"),
                  s.status,
                ])}
              />
            </Section>

            {/* Revenue chart */}
            <Section title="Biểu đồ doanh thu (group by day)">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <Chart
                  type="bar"
                  data={revenueSeries}
                  xKey="label"
                  yKey="value"
                  height={260}
                  tooltipLabel="Ngày"
                  tooltipValue="Doanh thu (VND)"
                />
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
