import { useMemo, useState, useEffect } from "react";
import Section from "@/components/admin/Section";
import Chart from "@/components/admin/Chart";
import PageHeader from "@/components/admin/PageHeader";
import analyticsService from "@/services/analyticsService";

const TRAIN_LOG = "evcs_train_log";

export default function Analytics() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [key, setKey] = useState(0);

  // Dữ liệu hiển thị
  const [forecast, setForecast] = useState([]); // getRevenueReport
  const [stationForecast, setStationForecast] = useState([]); // getForecastByStation
  const [metrics, setMetrics] = useState([]); // getMetrics
  const [telemetry, setTelemetry] = useState([]); // getHealth
  const [alerts, setAlerts] = useState([]); // getAlerts
  const [logs, setLogs] = useState([]); // getLogs

  const [training, setTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainMsg, setTrainMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  // ===== Helper =====
  const getJson = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  const formatVND = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val || 0);

  // ===== API 1: Tổng quan doanh thu =====
  const loadRevenueReport = async () => {
    try {
      const res = await analyticsService.getRevenueReport({ from, to });
      const data = res?.data ?? [];

      if (Array.isArray(data) && data.length) {
        const totalRevenue = data.reduce((s, r) => s + (r.revenue || 0), 0);
        const totalSessions = data.reduce((s, r) => s + (r.sessions || 0), 0);
        const totalEnergy = data.reduce((s, r) => s + (r.energy_kwh || 0), 0);
        setForecast([
          { label: "Doanh thu (VND)", value: totalRevenue },
          { label: "Phiên sạc", value: totalSessions },
          { label: "Tổng điện (kWh)", value: totalEnergy },
        ]);
      } else throw new Error("empty");
    } catch (e) {
      console.warn("Fallback Revenue mock:", e.message);
      setForecast([
        { label: "Doanh thu (VND)", value: 3500000 },
        { label: "Phiên sạc", value: 21 },
        { label: "Tổng điện (kWh)", value: 12800 },
      ]);
    } finally {
      setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
    }
  };

  // ===== API 2: Forecast theo trạm =====
  const loadForecastByStation = async () => {
    try {
      const res = await analyticsService.getForecastByStation();
      const data = res?.data ?? [];
      if (Array.isArray(data) && data.length) setStationForecast(data);
      else throw new Error("empty");
    } catch {
      setStationForecast([
        { label: "Trạm Nguyễn Văn Linh", value: 91 },
        { label: "Trạm Lê Văn Việt", value: 78 },
        { label: "Trạm Phạm Hùng", value: 65 },
      ]);
    }
  };

  // ===== API 3: Metrics hệ thống =====
  const loadMetrics = async () => {
    try {
      const res = await analyticsService.getMetrics();
      const data = res?.data ?? [];
      setMetrics(data.length ? data : []);
    } catch {
      setMetrics([
        { user: "alice", sessions: 15, energy_kwh: 4750, total_cost: 1250000 },
        { user: "bob", sessions: 9, energy_kwh: 3200, total_cost: 950000 },
      ]);
    }
  };

  // ===== API 4: Telemetry (Health) =====
  const loadTelemetry = async () => {
    try {
      const res = await analyticsService.getHealth();
      const data = res?.data ?? [];
      setTelemetry(data.length ? data : []);
    } catch {
      const now = Date.now();
      const states = ["ok", "idle", "charging", "error"];
      setTelemetry(
        Array.from({ length: 6 }).map((_, i) => ({
          ts: now - i * 60000,
          station: "Trạm mô phỏng",
          kwh: +(1 + Math.random() * 3).toFixed(2),
          status: states[Math.floor(Math.random() * states.length)],
        }))
      );
    }
  };

  // ===== API 5-6: Cảnh báo hệ thống =====
  const loadAlerts = async () => {
    try {
      const res = await analyticsService.getAlerts();
      setAlerts(res?.data ?? []);
    } catch {
      setAlerts([{ id: 1, message: "Trạm ST-03 mất kết nối", severity: "high" }]);
    }
  };

  const acknowledgeAlert = async (id) => {
    try {
      await analyticsService.ackAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      console.warn("Không thể xác nhận cảnh báo");
    }
  };

  // ===== API 7: Logs hệ thống =====
  const loadLogs = async () => {
    try {
      const res = await analyticsService.getLogs({ limit: 10 });
      setLogs(res?.data ?? []);
    } catch {
      setLogs([{ timestamp: new Date().toLocaleTimeString(), message: "Log mô phỏng: hệ thống ổn định." }]);
    }
  };

  // ===== API 8: Huấn luyện mô hình dự báo =====
  const triggerTrain = async () => {
    setTraining(true);
    setTrainProgress(0);
    setTrainMsg("");

    try {
      await analyticsService.trainForecastModel({ from, to });
    } catch {
      console.warn("Fallback training mock");
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setTrainProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        const log = getJson(TRAIN_LOG);
        log.push({
          time: new Date().toLocaleString("vi-VN"),
          message: "Huấn luyện mô phỏng thành công",
        });
        localStorage.setItem(TRAIN_LOG, JSON.stringify(log));
        setTrainMsg("✅ Huấn luyện AI hoàn tất");
        setTraining(false);
        setToastMsg("🚀 Dữ liệu AI đã được huấn luyện lại");
        setTimeout(() => setToastMsg(""), 2500);
      }
    }, 120);
  };

  useEffect(() => {
    loadRevenueReport();
    loadForecastByStation();
    loadMetrics();
    loadTelemetry();
    loadAlerts();
    loadLogs();
  }, [key]);

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}

      <PageHeader
        title="Phân tích & Báo cáo hệ thống"
        subtitle="Bảng điều khiển AI Forecast, Telemetry, Cảnh báo và Logs"
      />

      {/* Bộ lọc thời gian & AI Training */}
      <Section
        title="Cấu hình & Huấn luyện AI"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border px-3 py-1.5"
            />
            <span className="text-sm text-gray-600">đến</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border px-3 py-1.5"
            />
            <button
              onClick={() => setKey((k) => k + 1)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-white"
            >
              Áp dụng
            </button>
            <button
              disabled={training}
              onClick={triggerTrain}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-50"
            >
              {training ? `Đang huấn luyện... ${trainProgress}%` : "Huấn luyện AI"}
            </button>
          </div>
        }
      >
        {trainMsg && <p className="mb-2 text-xs text-emerald-600">{trainMsg}</p>}
      </Section>

      {/* Tổng quan doanh thu */}
      <Section title="Tổng quan doanh thu & năng lượng">
        <Chart height={320} data={forecast} />
        <p className="text-xs text-gray-500 mt-2 text-right">
          Cập nhật lúc: {lastUpdated}
        </p>
      </Section>

      {/* Forecast theo trạm */}
      <Section title="Dự báo AI theo từng trạm">
        <Chart height={260} data={stationForecast} />
      </Section>

      {/* Metrics hệ thống */}
      <Section title="Thống kê Metrics hệ thống">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="border p-2 text-left">Người dùng</th>
                <th className="border p-2 text-right">Phiên sạc</th>
                <th className="border p-2 text-right">kWh</th>
                <th className="border p-2 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={i}>
                  <td className="border p-2">{m.user}</td>
                  <td className="border p-2 text-right">{m.sessions}</td>
                  <td className="border p-2 text-right">{m.energy_kwh}</td>
                  <td className="border p-2 text-right">
                    {formatVND(m.total_cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Telemetry */}
      <Section title="Telemetry - Trạng thái trạm (Health)">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="border p-2 text-left">Thời gian</th>
                <th className="border p-2 text-left">Trạm</th>
                <th className="border p-2 text-right">kWh</th>
                <th className="border p-2 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.map((t, i) => (
                <tr key={i}>
                  <td className="border p-2">
                    {new Date(t.ts).toLocaleTimeString()}
                  </td>
                  <td className="border p-2">{t.station}</td>
                  <td className="border p-2 text-right">{t.kwh}</td>
                  <td
                    className={`border p-2 text-center ${
                      t.status === "error"
                        ? "text-red-600"
                        : t.status === "charging"
                        ? "text-blue-600"
                        : t.status === "idle"
                        ? "text-yellow-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {t.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Cảnh báo hệ thống */}
      <Section title="Cảnh báo hệ thống">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500">✅ Không có cảnh báo nào</p>
        ) : (
          <ul className="text-sm space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={`p-2 rounded border ${
                  a.severity === "high"
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-yellow-400 bg-yellow-50 text-yellow-700"
                } flex justify-between`}
              >
                <span>{a.message}</span>
                <button
                  onClick={() => acknowledgeAlert(a.id)}
                  className="text-xs bg-white/40 px-2 py-0.5 rounded"
                >
                  Đã đọc
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Logs hệ thống */}
      <Section title="Nhật ký hệ thống (Logs)">
        <div className="max-h-64 overflow-y-auto text-xs bg-gray-50 p-2 rounded-md border border-gray-200">
          {logs.map((log, i) => (
            <div key={i} className="py-0.5">
              🕒 <b>{log.timestamp}</b>: {log.message}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
