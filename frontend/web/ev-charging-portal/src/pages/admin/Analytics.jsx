// pages/admin/Analytics.jsx
import { useEffect, useMemo, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import Table from "@/components/admin/Table";
import { useAnalytics } from "@/hooks/useAnalytics";
import analyticsService from "@/services/analyticsService";
import paymentService from "@/services/paymentService";

const MONTH_OPTIONS = ["01","02","03","04","05","06","07","08","09","10","11","12"];

export default function Analytics() {
  const {
    loadingAnalytics,
    loadingMonitoring,
    error: ctxError,
    health,
    metrics,
    logs,
    alerts,
    aiStats,
    aiUserBehavior,
    aiForecast,
    getHealth,
    getMetrics,
    getLogs,
    getAlerts,
    ackAlert,
    getAIStats,
    getAIUserBehavior,
    getAIForecast,
  } = useAnalytics();

  const [localError, setLocalError] = useState("");
  const [aiError, setAIError] = useState("");
  const [reportType, setReportType] = useState("revenue");
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );
  const [forecastStationId, setForecastStationId] = useState("");
  const [forecastDays, setForecastDays] = useState(7);
  const [loadingReports, setLoadingReports] = useState(false);

  const [tableColumns, setTableColumns] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState([]);

  const showError = localError || ctxError?.message;

  /* ====================================================
     NORMALIZE MONITORING DATA
  ==================================================== */
  const monitoringLogs = useMemo(() => {
    if (!logs) return [];
    const raw = Array.isArray(logs.logs)
      ? logs.logs
      : Array.isArray(logs)
      ? logs
      : [];
    return raw.map((l) => ({
      log_id: l.log_id,
      ts: l.created_at,
      service: l.service_name,
      level: l.level,
      message: l.message,
    }));
  }, [logs]);

  const monitoringAlerts = useMemo(() => {
    if (!alerts) return [];
    if (Array.isArray(alerts.alerts)) return alerts.alerts;
    return Array.isArray(alerts) ? alerts : [];
  }, [alerts]);

  const metricsChart = useMemo(() => {
    if (!metrics) return [];
    const list = Array.isArray(metrics.metrics)
      ? metrics.metrics
      : Array.isArray(metrics)
      ? metrics
      : [];
    return list.map((m) => ({
      label: m.bucket,
      value: Number(m.avg_value || 0),
    }));
  }, [metrics]);

  /* ====================================================
     AI INSIGHTS DATA
  ==================================================== */
  const aiStatCards = useMemo(() => {
    if (!aiStats) return [];
    return [
      {
        label: "Người dùng hoạt động",
        value: Number(aiStats.active_users ?? 0),
      },
      {
        label: "Tổng số trạm",
        value: Number(aiStats.total_stations ?? 0),
      },
      {
        label: "Tổng sản lượng (kWh)",
        value: Number(aiStats.total_energy_kwh ?? 0),
      },
      {
        label: "Tổng doanh thu",
        value: Number(aiStats.total_revenue ?? 0),
        isCurrency: true,
      },
    ];
  }, [aiStats]);

  const topUserBehavior = useMemo(() => {
    if (!Array.isArray(aiUserBehavior) || aiUserBehavior.length === 0) return null;
    return aiUserBehavior[0];
  }, [aiUserBehavior]);

  const forecastChart = useMemo(() => {
    const list = aiForecast?.forecast || (Array.isArray(aiForecast) ? aiForecast : []);
    if (!Array.isArray(list)) return [];
    return list.map((f) => ({
      label: `Day ${f.day}`,
      value: Number(f.predicted_usage || 0),
    }));
  }, [aiForecast]);

  /* ====================================================
     COMMON
  ==================================================== */
  const resetTable = () => {
    setTableColumns([]);
    setTableData([]);
    setChartData([]);
  };

  const buildMonthYYYYMM = () => {
    const year = new Date().getFullYear();
    return `${year}-${selectedMonth}`;
  };

  /* ====================================================
     LOAD MONITORING
  ==================================================== */
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

  const handleAckAlert = async (alertId) => {
    const res = await ackAlert({ alert_id: alertId });
    if (!res?.success && res?.data?.success !== true) {
      setLocalError("ACK thất bại.");
      return;
    }
    await getAlerts();
  };

  /* ====================================================
     LOAD AI INSIGHTS
  ==================================================== */
  const loadAIInsights = async () => {
    setAIError("");
    try {
      const [statsRes, behaviorRes] = await Promise.all([
        getAIStats(),
        getAIUserBehavior(),
      ]);

      if (statsRes?.success === false || behaviorRes?.success === false) {
        setAIError("Không thể tải dữ liệu AI.");
      }
    } catch {
      setAIError("Không thể tải dữ liệu AI.");
    }
  };

  const handleForecast = async (e) => {
    e?.preventDefault?.();
    setAIError("");

    const stationId = forecastStationId.trim();
    const daysValue = Number.isFinite(Number(forecastDays))
      ? Number(forecastDays)
      : 7;

    if (!stationId) {
      setAIError("Vui lòng nhập Station ID để dự báo.");
      return;
    }

    const res = await getAIForecast({ stationId, days: daysValue });
    if (res?.success === false) {
      setAIError(res?.error?.message || "Không thể dự báo nhu cầu trạm.");
    }
  };

  /* ====================================================
     LOAD REPORTS (LIST MODE)
  ==================================================== */
  const loadReports = async () => {
    resetTable();
    setLocalError("");
    setLoadingReports(true);

    const monthYYYYMM = buildMonthYYYYMM();

    try {
      // 1) REVENUE
      if (reportType === "revenue") {
        const res = await paymentService.getMonthlyRevenue();
        const data = res?.data ?? res ?? {};
        const monthly = data.monthly_revenue || {};

        const rows = Object.entries(monthly)
          .map(([month, total]) => ({
            month,
            total: Number(total || 0),
          }))
          .sort((a, b) => a.month.localeCompare(b.month));

        setChartData(rows.map((r) => ({ label: r.month, value: r.total })));

        setTableColumns([
          { title: "Month", dataIndex: "month" },
          {
            title: "Total Revenue",
            dataIndex: "total",
            render: (v) => Number(v).toLocaleString("vi-VN"),
          },
        ]);
        setTableData(rows);
      }

      // 2) USER MONTHLY LIST
      if (reportType === "user") {
        const res = await analyticsService.getUsersMonthlyList(monthYYYYMM);
        const list = res?.data?.data ?? [];

        if (list.length === 0) {
          setLocalError("Không có dữ liệu user trong tháng này.");
          return;
        }

        setTableColumns([
          { title: "User ID", dataIndex: "user_id" },
          { title: "Month", dataIndex: "month" },
          {
            title: "Total Cost",
            dataIndex: "total_cost",
            render: (v) => Number(v).toLocaleString("vi-VN"),
          },
          { title: "Total Sessions", dataIndex: "total_sessions" },
        ]);
        setTableData(list);

        setChartData(
          list.map((u) => ({
            label: u.user_id.slice(0, 6) + "...",
            value: Number(u.total_cost || 0),
          }))
        );
      }

      // 3) STATION MONTHLY LIST
      if (reportType === "station") {
        const res = await analyticsService.getStationsMonthlyList(monthYYYYMM);
        const list = res?.data?.data ?? [];

        if (list.length === 0) {
          setLocalError("Không có dữ liệu trạm trong tháng này.");
          return;
        }

        setTableColumns([
          { title: "Station ID", dataIndex: "station_id" },
          { title: "Date", dataIndex: "date" },
          {
            title: "Revenue",
            dataIndex: "revenue",
            render: (v) => Number(v).toLocaleString("vi-VN"),
          },
          { title: "Sessions", dataIndex: "sessions" },
          { title: "Total kWh", dataIndex: "total_kwh" },
        ]);
        setTableData(list);

        setChartData(
          list.map((s) => ({
            label: s.date,
            value: Number(s.revenue || 0),
          }))
        );
      }
    } catch (e) {
      setLocalError(
        e?.response?.data?.message ||
          e?.message ||
          "Không thể tải báo cáo."
      );
    } finally {
      setLoadingReports(false);
    }
  };

  /* ====================================================
     INITIAL LOAD
  ==================================================== */
  useEffect(() => {
    loadMonitoring();
    loadReports();
    loadAIInsights();
  }, []);

  /* ====================================================
     RENDER UI
  ==================================================== */
  return (
    <div className="min-h-screen bg-[#f5f7fb] px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader title="Báo cáo vận hành" subtitle="Doanh thu – Monitoring" />

        {showError && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
            {showError}
          </div>
        )}

        {/* ===================== AI INSIGHTS ===================== */}
        <Section title="AI Insights">
          {aiError && (
            <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2 text-sm">
              {aiError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={loadAIInsights}
              disabled={loadingAnalytics}
              className="px-4 py-2 bg-indigo-700 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingAnalytics ? "Đang phân tích..." : "Làm mới AI"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {aiStatCards.length === 0 ? (
              <div className="col-span-full bg-white border rounded-xl p-4 text-slate-500 text-sm">
                Chưa có dữ liệu thống kê AI. Nhấn "Làm mới AI" để tải.
              </div>
            ) : (
              aiStatCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white border rounded-xl p-4 shadow-sm"
                >
                  <div className="text-sm text-slate-500">{card.label}</div>
                  <div className="text-2xl font-bold mt-1">
                    {card.isCurrency
                      ? Number(card.value || 0).toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          maximumFractionDigits: 0,
                        })
                      : Number(card.value || 0).toLocaleString("vi-VN")}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-slate-800">
                  Phân tích hành vi người dùng
                </div>
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                  AI
                </span>
              </div>

              {topUserBehavior ? (
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    Người dùng: {topUserBehavior.user_id}
                  </div>
                  <div className="text-sm text-slate-600">
                    Phân loại:{" "}
                    <span className="font-semibold text-blue-800">
                      {topUserBehavior.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-slate-500">Tổng phiên</div>
                      <div className="text-lg font-semibold">
                        {Number(topUserBehavior.total_sessions ?? 0).toLocaleString(
                          "vi-VN"
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-slate-500">Thời lượng TB</div>
                      <div className="text-lg font-semibold">
                        {topUserBehavior.avg_duration != null
                          ? Number(topUserBehavior.avg_duration).toLocaleString(
                              "vi-VN",
                              { maximumFractionDigits: 1 }
                            ) + " phút"
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-slate-500">Năng lượng TB</div>
                      <div className="text-lg font-semibold">
                        {topUserBehavior.avg_energy != null
                          ? Number(topUserBehavior.avg_energy).toLocaleString(
                              "vi-VN",
                              { maximumFractionDigits: 1 }
                            ) + " kWh"
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-slate-500">Nhóm</div>
                      <div className="text-lg font-semibold text-indigo-700">
                        {topUserBehavior.category}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  Chưa có dữ liệu hành vi người dùng. Nhấn "Làm mới AI" để tải.
                </div>
              )}
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-slate-800">
                  Dự báo nhu cầu trạm (AI)
                </div>
              </div>

              <form
                onSubmit={handleForecast}
                className="flex flex-wrap items-end gap-3 mb-3"
              >
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-slate-600 block mb-1">
                    Station ID
                  </label>
                  <input
                    value={forecastStationId}
                    onChange={(e) => setForecastStationId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Nhập Station ID"
                  />
                </div>
                <div className="w-[140px]">
                  <label className="text-xs text-slate-600 block mb-1">
                    Số ngày dự báo
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={forecastDays}
                    onChange={(e) => setForecastDays(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingAnalytics}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingAnalytics ? "Đang dự báo..." : "Dự báo"}
                </button>
              </form>

              {forecastChart.length === 0 ? (
                <div className="text-sm text-slate-500 h-[220px] flex items-center justify-center border rounded-lg">
                  Nhập Station ID và nhấn Dự báo để xem kết quả.
                </div>
              ) : (
                <div className="space-y-2">
                  <Chart
                    type="line"
                    height={240}
                    data={forecastChart}
                    xKey="label"
                    yKey="value"
                  />
                  {aiForecast?.station_id && (
                    <div className="text-xs text-slate-500">
                      Station: <span className="font-semibold">{aiForecast.station_id}</span>{" "}
                      • Horizon: {forecastChart.length} ngày
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Section>

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

          {/* HEALTH */}
          <Section title="System Health">
            <div className="bg-white rounded-xl border p-4 shadow-sm">

              {/* ======= SCROLL ADDED HERE ======= */}
              {!health?.services || health.services.length === 0 ? (
                loadingMonitoring ? "Đang tải..." : "Không có dữ liệu."
              ) : (
                <div className="max-h-[420px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {health.services.map((s) => (
                      <div
                        key={s.service_id}
                        className="border rounded-lg p-3 flex justify-between items-center"
                      >
                        <span className="font-semibold">{s.service_name}</span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            s.status === "ok"
                              ? "bg-green-100 text-green-800"
                              : s.status === "degraded"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* METRICS */}
          <Section title="Metrics">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              {metricsChart.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">
                  Không có dữ liệu metrics để hiển thị.
                </div>
              ) : (
                <Chart
                  type="line"
                  height={260}
                  data={metricsChart}
                  xKey="label"
                  yKey="value"
                />
              )}
            </div>
          </Section>

          {/* LOGS & ALERTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Logs (ELK)">
              <div className="bg-white rounded-xl border shadow-sm max-h-80 overflow-y-auto">
                <div className="p-3">
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
              </div>
            </Section>

            <Section title="Alerts">
              <div className="bg-white rounded-xl border shadow-sm max-h-80 overflow-y-auto p-4 space-y-3">
                {monitoringAlerts.length === 0
                  ? "Không có alert."
                  : monitoringAlerts.map((a) => (
                      <div
                        key={a.alert_id}
                        className="border p-3 rounded-lg flex justify-between items-center"
                      >
                        <div className="font-semibold">
                          [{a.type}] {a.status}
                        </div>

                        {a.status !== "acknowledged" && (
                          <button
                            onClick={() => handleAckAlert(a.alert_id)}
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

            {reportType !== "revenue" && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600">Tháng</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={loadReports}
                disabled={loadingReports}
                className="px-5 py-2 bg-blue-800 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingReports ? "Đang tải..." : "Lấy dữ liệu"}
              </button>
            </div>
          </div>
        </Section>

        {/* CHART */}
        {chartData.length > 0 && (
          <Section title="Biểu đồ">
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <Chart
                type="bar"
                height={260}
                data={chartData}
                xKey="label"
                yKey="value"
              />
            </div>
          </Section>
        )}

        {/* TABLE */}
        <Section title="Kết quả">
          <div className="bg-white border rounded-xl shadow-sm p-3">
            <Table scrollX columns={tableColumns} data={tableData} />
          </div>
        </Section>
      </div>
    </div>
  );
}
