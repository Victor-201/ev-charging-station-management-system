import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import Table from "@/components/admin/Table";
import apiClient from "@/api/apiClient";

/**
 * Analytics – bản chuẩn theo API thật trong PDF
 */
export default function Analytics() {
  const [activeTab, setActiveTab] = useState("monitoring");

  // --- MONITORING ---
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loadingMonitoring, setLoadingMonitoring] = useState(false);

  // --- ANALYTICS ---
  const [userReport, setUserReport] = useState(null);
  const [stationDaily, setStationDaily] = useState([]);
  const [revenueDaily, setRevenueDaily] = useState([]);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    userId: "",
    stationId: "",
    date: new Date().toISOString().slice(0, 10),
    month: new Date().toISOString().slice(0, 7),
  });

  // ====================== MONITORING ======================
  const loadMonitoring = async () => {
    setLoadingMonitoring(true);
    setError("");
    try {
      const metricsRes = await apiClient.get("/api/v1/monitoring/metrics");
      const logsRes = await apiClient.get("/api/v1/monitoring/logs");
      const alertsRes = await apiClient.get("/api/v1/monitoring/alerts");

      setMetrics(metricsRes.data);
      setLogs(logsRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (err) {
      setError("Không thể tải dữ liệu monitoring.");
    } finally {
      setLoadingMonitoring(false);
    }
  };

  const handleAckAlert = async (id) => {
    try {
      await apiClient.post("/api/v1/monitoring/alerts/ack", {
        alert_id: id,
        user_id: "admin",
      });
      loadMonitoring();
    } catch {
      alert("Không thể ACK alert");
    }
  };

  useEffect(() => {
    if (activeTab === "monitoring") loadMonitoring();
  }, [activeTab]);

  // ====================== ANALYTICS ======================
  const loadAnalytics = async () => {
    setError("");
    try {
      // USER MONTHLY REPORT (analytics-service)
      let userRes = null;
      if (filters.userId) {
        userRes = await apiClient.get(
          `/api/v1/analytics/users/${filters.userId}/monthly`,
          { params: { month: filters.month } }
        );
        setUserReport(userRes.data || null);
      } else setUserReport(null);

      // STATION DAILY SESSIONS (analytics-service)
      let stationRes = null;
      if (filters.stationId) {
        stationRes = await apiClient.get(
          `/api/v1/analytics/stations/${filters.stationId}/daily`,
          { params: { date: filters.date } }
        );
        setStationDaily(stationRes.data?.sessions || []);
      } else setStationDaily([]);

      // REVENUE DAILY (payment-service)
      const revenueRes = await apiClient.get(
        "/api/v1/payments/revenue/daily",
        {
          params: {
            month: filters.month,
            station_id: filters.stationId || undefined,
          },
        }
      );

      setRevenueDaily(
        revenueRes.data?.items?.map((d) => ({
          label: d.date,
          value: Number(d.total_revenue || 0),
        })) || []
      );
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu analytics.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Monitoring & Analytics"
          subtitle="Giám sát hệ thống và phân tích doanh thu / trạm / người dùng"
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
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-300"
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

        {/* ============== MONITORING TAB ============== */}
        {activeTab === "monitoring" && (
          <>
            <Section title="Metrics">
              {loadingMonitoring ? (
                <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
              ) : (
                <Chart
                  type="line"
                  height={250}
                  data={
                    metrics?.series?.map((p) => ({
                      label: p.timestamp,
                      value: p.value,
                    })) || []
                  }
                  xKey="label"
                  yKey="value"
                />
              )}
            </Section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Logs">
                <Table
                  columns={["Timestamp", "Service", "Level", "Message"]}
                  rows={logs.map((l) => [
                    l.timestamp,
                    l.service,
                    l.level,
                    l.message,
                  ])}
                />
              </Section>

              <Section title="Alerts">
                {alerts.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Không có alert đang kích hoạt.
                  </p>
                ) : (
                  alerts.map((a) => (
                    <div
                      key={a.id}
                      className="border rounded-lg bg-white px-3 py-2 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold">{a.summary}</div>
                        <div className="text-xs text-slate-500">
                          {a.status} – {a.startsAt}
                        </div>
                      </div>
                      {a.status !== "acknowledged" && (
                        <button
                          onClick={() => handleAckAlert(a.id)}
                          className="bg-emerald-600 text-white px-3 py-1 rounded text-xs"
                        >
                          ACK
                        </button>
                      )}
                    </div>
                  ))
                )}
              </Section>
            </div>
          </>
        )}

        {/* ============== ANALYTICS TAB ============== */}
        {activeTab === "analytics" && (
          <>
            <Section title="Bộ lọc báo cáo">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border rounded-xl p-4">
                <div>
                  <label className="text-xs text-slate-500">
                    User ID (monthly)
                  </label>
                  <input
                    value={filters.userId}
                    onChange={(e) =>
                      setFilters({ ...filters, userId: e.target.value })
                    }
                    className="w-full border rounded px-2 py-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Station ID (daily)
                  </label>
                  <input
                    value={filters.stationId}
                    onChange={(e) =>
                      setFilters({ ...filters, stationId: e.target.value })
                    }
                    className="w-full border rounded px-2 py-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">Month</label>
                  <input
                    type="month"
                    value={filters.month}
                    onChange={(e) =>
                      setFilters({ ...filters, month: e.target.value })
                    }
                    className="w-full border rounded px-2 py-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">Date</label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) =>
                      setFilters({ ...filters, date: e.target.value })
                    }
                    className="w-full border rounded px-2 py-1"
                  />
                </div>

                <div className="md:col-span-4 flex justify-end">
                  <button
                    onClick={loadAnalytics}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                  >
                    Lấy dữ liệu
                  </button>
                </div>
              </div>
            </Section>

            <Section title="User Monthly Report">
              {userReport ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-xs text-slate-500">Tổng phiên</div>
                    <div className="text-xl font-bold">
                      {userReport.total_sessions}
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-xs text-slate-500">Tổng kWh</div>
                    <div className="text-xl font-bold">
                      {userReport.total_kwh}
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="text-xs text-slate-500">Chi phí</div>
                    <div className="text-xl font-bold text-emerald-600">
                      {userReport.total_cost?.toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Nhập userId để xem báo cáo.
                </p>
              )}
            </Section>

            <Section title="Station Daily Sessions">
              <Table
                columns={[
                  "ID",
                  "User",
                  "Start",
                  "kWh",
                  "Cost",
                  "Status",
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

            <Section title="Revenue Daily (Payment-service)">
              <Chart
                type="bar"
                height={250}
                data={revenueDaily}
                xKey="label"
                yKey="value"
              />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
