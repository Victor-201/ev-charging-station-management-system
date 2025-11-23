// pages/admin/Analytics.jsx
import { useEffect, useMemo, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import Table from "@/components/admin/Table";
import { useAnalytics } from "@/hooks/useAnalytics";
import analyticsService from "@/services/analyticsService";
import paymentService from "@/services/paymentService";

const DEFAULT_FORECAST_DAYS = 7;
const MONTH_OPTIONS = [
  "01","02","03","04","05","06","07","08","09","10","11","12"
];
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) =>
  String(new Date().getFullYear() - i)
);
// Tháng có dữ liệu seed cho station_daily_reports
const STATION_MONTHS = ["2025-07", "2025-08", "2025-09", "2025-10"];

const getRecentMonths = (count = 12) => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }
  return months;
};

/* ===========================================================
   MAIN COMPONENT
   =========================================================== */
export default function Analytics() {
  /* ------------------- Context API ------------------- */
  const {
    loadingAnalytics,
    loadingMonitoring,
    error: ctxError,
    // monitoring
    health,
    metrics,
    logs,
    alerts,
    getHealth,
    getMetrics,
    getLogs,
    getAlerts,
    ackAlert,
  } = useAnalytics();

  /* ------------------- Local state ------------------- */
  const [localError, setLocalError] = useState("");

  /* ------------------- Reports ------------------- */
  const [reportType, setReportType] = useState("revenue");
  const [reportUserId, setReportUserId] = useState("U001"); // mặc định theo seed
  const [reportStationId, setReportStationId] = useState("ST001"); // mặc định theo seed
  const recentMonths = useMemo(() => getRecentMonths(12), []);

  const [tableColumns, setTableColumns] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState([]);

  /* ------------------- Analytics AI ------------------- */
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiStats, setAiStats] = useState(null);
  const [aiUsers, setAiUsers] = useState([]);
  const [aiForecast, setAiForecast] = useState([]);
  const [aiForecastStationId, setAiForecastStationId] = useState("");

  const [trainStations, setTrainStations] = useState("");

  const showError = localError || aiError || ctxError?.message;

  /* ------------------- Normalize monitoring data ------------------- */
  const monitoringLogs = useMemo(() => {
    if (!logs) return [];
    if (Array.isArray(logs.logs)) return logs.logs;
    if (Array.isArray(logs.items)) return logs.items;
    return Array.isArray(logs) ? logs : [];
  }, [logs]);

  const monitoringAlerts = useMemo(() => {
    if (!alerts) return [];
    if (Array.isArray(alerts.alerts)) return alerts.alerts;
    return Array.isArray(alerts) ? alerts : [];
  }, [alerts]);

  const metricsChart = useMemo(() => {
    if (!metrics) return [];
    const series = metrics.series || metrics.values;
    if (!Array.isArray(series)) return [];
    return series.map((p, i) => ({
      label: p.timestamp || p.bucket || `#${i + 1}`,
      value: Number(p.value || p.avg_value || p[0] || 0),
    }));
  }, [metrics]);

  /* ===========================================================
     REPORTS
     =========================================================== */
  const resetTable = () => {
    setTableColumns([]);
    setTableData([]);
    setChartData([]);
  };

  const loadMonitoring = async () => {
    setLocalError("");
    try {
      await Promise.all([
        getHealth(),
        getMetrics(),
        getLogs({ size: 100 }),
        getAlerts(),
      ]);
    } catch {
      setLocalError("Không thể tải Monitoring.");
    }
  };

  const handleAckAlert = async (id) => {
    const res = await ackAlert({ alert_id: id });
    if (!res?.success) {
      setLocalError("ACK thất bại");
      return;
    }
    getAlerts();
  };

  const loadReports = async () => {
    resetTable();
    setLocalError("");

    try {
      /* ========== REVENUE REPORT ========== */
      if (reportType === "revenue") {
        const res = await paymentService.getMonthlyRevenue();
        const data = res?.data ?? res ?? {};
        const monthly = data.monthly_revenue || {};

        const entries = Object.entries(monthly)
          .map(([month, total]) => ({
            month,
            total: Number(total || 0),
          }))
          .sort((a, b) => a.month.localeCompare(b.month));

        setChartData(
          entries.map((item) => ({
            label: item.month,
            value: item.total,
          }))
        );

        setTableColumns([
          { title: "Month", dataIndex: "month" },
          {
            title: "Total Revenue",
            dataIndex: "total",
            render: (v) => Number(v).toLocaleString("vi-VN"),
          },
        ]);

        setTableData(entries);
      }

      /* ========== USER MONTHLY REPORT (DB: user_monthly_reports) ========== */
      if (reportType === "user") {
        const targetUser = reportUserId?.trim();
        if (!targetUser) {
          setLocalError("Vui lòng nhập User ID.");
          return;
        }

        const results = await Promise.allSettled(
          recentMonths.map((month) =>
            analyticsService.getUserMonthlyReport(targetUser, month)
          )
        );

        // FIX: map đúng schema seed: billing_month, total_sessions, total_cost
        const rows = results
          .map((res, idx) => {
            if (res.status !== "fulfilled") return null;
            const data = res.value?.data ?? res.value ?? {};
            return {
              user_id: data.user_id || targetUser,
              month: data.billing_month || recentMonths[idx],
              sessions: Number(data.total_sessions || 0),
              total_cost: Number(data.total_cost || 0),
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.month.localeCompare(b.month));

        if (rows.length === 0) {
          setLocalError("Không có dữ liệu người dùng.");
          return;
        }

        setChartData(
          rows.map((row) => ({
            label: row.month,
            value: row.total_cost,
          }))
        );

        setTableColumns([
          { title: "User ID", dataIndex: "user_id" },
          { title: "Month", dataIndex: "month" },
          { title: "Sessions", dataIndex: "sessions" },
          {
            title: "Total Cost",
            dataIndex: "total_cost",
            render: (v) => Number(v).toLocaleString("vi-VN"),
          },
        ]);

        setTableData(rows);
      }

      /* ========== STATION MONTHLY (lấy 1 ngày đại diện mỗi tháng gần đây) ========== */
      if (reportType === "station") {
        const targetStation = reportStationId?.trim();
        if (!targetStation) {
          setLocalError("Vui lòng nhập Station ID.");
          return;
        }

        const dayCandidates = ["01", "05", "10", "15", "20", "25", "30"];
        const rows = [];

        for (const month of STATION_MONTHS) {
          let found = null;
          for (const day of dayCandidates) {
            // eslint-disable-next-line no-await-in-loop
            const res = await analyticsService.getStationDailyReport(targetStation, `${month}-${day}`);
            const data = res?.data ?? res ?? null;
            if (data) {
              found = {
                station_id: data.station_id || targetStation,
                date: data.report_date || data.date || `${month}-${day}`,
                month,
                sessions: Number(data.sessions || 0),
                total_kwh: Number(data.total_kwh || 0),
                revenue: Number(data.revenue || 0),
              };
              break;
            }
          }
          if (found) rows.push(found);
        }

        if (rows.length === 0) {
          setLocalError("Không có dữ liệu trạm.");
          return;
        }

        setChartData(
          rows
            .sort((a, b) => a.month.localeCompare(b.month))
            .map((row) => ({ label: row.month, value: row.revenue }))
        );

        setTableColumns([
          { title: "Station", dataIndex: "station_id" },
          { title: "Date", dataIndex: "date" },
          { title: "Month", dataIndex: "month" },
          { title: "Sessions", dataIndex: "sessions" },
          { title: "Total kWh", dataIndex: "total_kwh" },
          {
            title: "Revenue",
            dataIndex: "revenue",
            render: (v) => Number(v).toLocaleString("vi-VN"),
          },
        ]);

        setTableData(rows.sort((a, b) => a.date.localeCompare(b.date)));
      }

      // Tải thêm dữ liệu AI để hiển thị trên tab Reports (không dùng ID mặc định)
      await Promise.allSettled([loadAIStats(), loadAIUsers()]);
    } catch {
      setLocalError("Không thể tải báo cáo.");
    }
  };

  useEffect(() => {
    setLocalError("");
    loadMonitoring();
    loadAIStats();
    loadAIUsers();
    loadReports(); // tự load báo cáo mặc định
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================================================
     ANALYTICS AI
     =========================================================== */
  const loadAIStats = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await analyticsService.getSystemStats();
      setAiStats(res?.data?.data ?? null);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi tải thống kê AI.";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const loadAIUsers = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const r = await analyticsService.analyzeUserBehavior();
      setAiUsers(r?.data?.data ?? []);
    } catch {
      setAiError("Lỗi tải hành vi người dùng.");
    } finally {
      setAiLoading(false);
    }
  };

  const loadAIForecast = async (stationIdOverride) => {
    const targetId = stationIdOverride || aiForecastStationId;
    if (!targetId) {
      setAiError("Thiếu stationId.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const r = await analyticsService.forecastStationDemand(targetId, {
        days: DEFAULT_FORECAST_DAYS,
      });
      setAiForecastStationId(targetId);
      setAiForecast(r?.data?.forecast ?? []);
    } catch {
      setAiError("Lỗi dự báo.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleTrainForecast = async () => {
    setLocalError("");
    try {
      await analyticsService.trainForecastModel({
        model: "demand_forecast",
        stations: trainStations
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } catch {
      setLocalError("Huấn luyện mô hình thất bại.");
    }
  };

  /* ===========================================================
     RENDER
     =========================================================== */
  return (
    <div className="min-h-screen bg-[#f5f7fb] px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader title="Báo cáo vận hành" subtitle="Doanh thu – Phân tích AI" />

        {/* ERROR */}
        {showError && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
            {showError}
          </div>
        )}

        {/* ===================== MONITORING ===================== */}
        <Section title="Monitoring">
          <div className="flex gap-3 mb-4">
            <button
              onClick={loadMonitoring}
              className="px-4 py-2 bg-blue-800 text-white rounded-lg"
              disabled={loadingMonitoring}
            >
              {loadingMonitoring ? "Đang tải..." : "Refresh"}
            </button>
          </div>

          <Section title="System Health">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              {!health ? (
                loadingMonitoring ? "Đang tải..." : "Không có dữ liệu."
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(health.services || {}).map(([name, status]) => (
                    <div
                      key={name}
                      className="border rounded-lg p-3 flex justify-between items-center"
                    >
                      <span className="font-semibold">{name}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          status === "up"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section title="Metrics">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <Chart type="line" height={260} data={metricsChart} xKey="label" yKey="value" />
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Logs (ELK)">
              <div className="bg-white rounded-xl border p-3 shadow-sm">
                <Table
                  scrollX
                  columns={[
                    { title: "Time", dataIndex: "ts" },
                    { title: "Service", dataIndex: "service" },
                    { title: "Level", dataIndex: "level" },
                    {
                      title: "Message",
                      dataIndex: "message",
                      render: (x) => (
                        <div className="whitespace-pre-wrap text-sm">{x}</div>
                      ),
                    },
                  ]}
                  data={monitoringLogs}
                />
              </div>
            </Section>

            <Section title="Alerts">
              <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
                {monitoringAlerts.length === 0
                  ? "Không có alert."
                  : monitoringAlerts.map((a) => (
                      <div
                        key={a.id}
                        className="border p-3 rounded-lg flex justify-between items-center"
                      >
                        <div className="font-semibold">
                          [{a.type}] {a.status}
                        </div>

                        {a.status !== "acknowledged" && (
                          <button
                            onClick={() => handleAckAlert(a.id)}
                            className="px-3 py-1 bg-blue-700 text-white rounded-md"
                          >
                            ACK
                          </button>
                        )}
                      </div>
                    ))}
              </div>
            </Section>
          </div>
        </Section>

        {/* ===================== REPORTS ===================== */}
        <Section title="Báo cáo vận hành">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="text-sm font-semibold text-slate-700">
              Chọn loại báo cáo
            </label>

            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                resetTable();
                setLocalError("");
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 bg-white"
            >
              <option value="revenue">Doanh thu</option>
              <option value="user">Người dùng (tháng)</option>
              <option value="station">Trạm (tháng)</option>
            </select>

            {reportType === "user" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600">User ID</label>
                <input
                  value={reportUserId}
                  onChange={(e) => setReportUserId(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-white"
                  placeholder="VD: U001"
                />
              </div>
            )}

            {reportType === "station" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600">Station ID</label>
                <input
                  value={reportStationId}
                  onChange={(e) => setReportStationId(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-white"
                  placeholder="VD: ST001"
                />
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={loadReports}
                className="px-5 py-2 bg-blue-800 text-white rounded-lg"
              >
                {loadingAnalytics ? "Đang tải..." : "Lấy dữ liệu"}
              </button>
            </div>
          </div>
        </Section>

        {chartData.length > 0 && (
          <Section title="Biểu đồ">
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <Chart type="bar" height={260} data={chartData} xKey="label" yKey="value" />
            </div>
          </Section>
        )}

        <Section title="Kết quả">
          <div className="bg-white border rounded-xl shadow-sm p-3">
            <Table scrollX columns={tableColumns} data={tableData} />
          </div>
        </Section>

        {/* AI INSIGHTS */}
        {(aiStats || aiUsers.length > 0 || aiForecast.length > 0) && (
          <Section title="Phân tích AI">
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                {!aiStats ? (
                  aiLoading ? "Đang tải..." : "Không có dữ liệu."
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-3">
                      <div className="text-xs text-slate-600">Active Users</div>
                      <div className="text-2xl font-semibold">
                        {aiStats.active_users}
                      </div>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="text-xs text-slate-600">Total Stations</div>
                      <div className="text-2xl font-semibold">
                        {aiStats.total_stations}
                      </div>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="text-xs text-slate-600">Energy (kWh)</div>
                      <div className="text-2xl font-semibold">
                        {aiStats.total_energy_kwh}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User behavior */}
              {aiUsers.length > 0 && (
                <div className="bg-white border rounded-xl shadow-sm p-3">
                  <div className="text-sm font-semibold mb-2">
                    Hành vi người dùng
                  </div>
                  <Table
                    scrollX
                    columns={[
                      { title: "User ID", dataIndex: "user_id" },
                      { title: "Total Sessions", dataIndex: "total_sessions" },
                      { title: "Avg Duration", dataIndex: "avg_duration" },
                      { title: "Avg Energy", dataIndex: "avg_energy" },
                      { title: "Category", dataIndex: "category" },
                    ]}
                    data={aiUsers}
                  />
                </div>
              )}

              {/* Forecast */}
              <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    placeholder="Nhập Station ID"
                    value={aiForecastStationId}
                    onChange={(e) => setAiForecastStationId(e.target.value)}
                    className="border px-3 py-2 rounded-lg w-full"
                  />
                  <button
                    onClick={() => loadAIForecast()}
                    className="px-4 py-2 bg-blue-800 text-white rounded-lg"
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Đang tải..." : "Dự báo"}
                  </button>
                </div>

                <div className="text-xs text-slate-500">
                  Dùng mã trạm trong seed (ví dụ: ST001, ST002, ST003) rồi nhấn Dự báo.
                </div>

                {aiForecast.length > 0 ? (
                  <>
                    <Chart
                      type="line"
                      height={240}
                      data={aiForecast.map((f) => ({
                        label: `Day ${f.day}`,
                        value: f.predicted_usage,
                      }))}
                    />

                    <Table
                      scrollX
                      columns={[
                        { title: "Day", dataIndex: "day" },
                        { title: "Predicted Usage", dataIndex: "predicted_usage" },
                      ]}
                      data={aiForecast}
                    />
                  </>
                ) : (
                  <div className="text-sm text-slate-500">
                    Nhập Station ID và nhấn Dự báo để xem kết quả.
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}
