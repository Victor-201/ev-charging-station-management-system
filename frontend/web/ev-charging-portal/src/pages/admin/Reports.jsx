import { useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import apiClient from "@/api/apiClient";

// =============================
// REPORT TYPE CONFIG
// =============================
const REPORT_TYPES = [
  {
    key: "revenue",
    label: "Doanh thu",
    desc: "Báo cáo doanh thu theo khoảng thời gian / trạm.",
    endpoint: "/api/v1/analytics/reports/revenue",
  },
  {
    key: "user",
    label: "Theo người dùng",
    desc: "Báo cáo chi phí & usage theo user (theo tháng).",
    endpoint: "/api/v1/analytics/reports/user",
  },
  {
    key: "station",
    label: "Theo trạm",
    desc: "Báo cáo sessions / kWh theo trạm (theo ngày).",
    endpoint: "/api/v1/analytics/reports/station",
  },
];

export default function Reports() {
  const [reportType, setReportType] = useState("revenue");

  const [params, setParams] = useState({
    userId: "",
    stationId: "",
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    groupBy: "day",
  });

  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cfg = REPORT_TYPES.find((r) => r.key === reportType);

  const setParam = (key, value) =>
    setParams((p) => ({
      ...p,
      [key]: value,
    }));

  // =============================
  // BUILD API REQUEST
  // =============================
  const buildRequest = () => {
    if (reportType === "revenue") {
      return {
        url: cfg.endpoint,
        query: {
          station_id: params.stationId || undefined,
          from: params.from,
          to: params.to,
          group_by: params.groupBy,
        },
      };
    }

    if (reportType === "user") {
      if (!params.userId) throw new Error("Vui lòng nhập User ID.");

      return {
        url: `${cfg.endpoint}/${params.userId}/monthly`,
        query: {
          month: params.from.slice(0, 7), // yyyy-MM
        },
      };
    }

    if (reportType === "station") {
      if (!params.stationId) throw new Error("Vui lòng nhập Station ID.");

      return {
        url: `${cfg.endpoint}/${params.stationId}/daily`,
        query: {
          date: params.from,
        },
      };
    }
  };

  // =============================
  // FETCH REPORT
  // =============================
  const fetchReport = async () => {
    try {
      setError("");
      setLoading(true);
      setRows([]);
      setColumns([]);

      const req = buildRequest();
      const res = await apiClient.get(req.url, { params: req.query });
      const data = res.data;

      // ===== REVENUE =====
      if (reportType === "revenue") {
        const items = data.items || data.daily || [];

        setColumns(["Ngày", "Doanh thu (VND)"]);
        setRows(
          items.map((i) => [
            i.date,
            i.total_revenue?.toLocaleString("vi-VN") || 0,
          ])
        );
        return;
      }

      // ===== USER REPORT =====
      if (reportType === "user") {
        setColumns(["User ID", "Tổng phiên", "Tổng kWh", "Tổng chi phí (VND)"]);

        setRows([
          [
            data.user_id,
            data.total_sessions,
            data.total_kwh,
            data.total_cost?.toLocaleString("vi-VN") || 0,
          ],
        ]);
        return;
      }

      // ===== STATION DAILY REPORT =====
      if (reportType === "station") {
        const sessions = data.sessions || [];

        setColumns([
          "Session ID",
          "User",
          "Bắt đầu",
          "KWh",
          "Chi phí (VND)",
        ]);

        setRows(
          sessions.map((s) => [
            s.id,
            s.user_id,
            s.start_time,
            s.energy_kwh,
            s.cost?.toLocaleString("vi-VN") || 0,
          ])
        );
        return;
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Không thể tải báo cáo."
      );
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // RENDER
  // =============================
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Báo cáo chi tiết"
          subtitle="Dữ liệu lấy trực tiếp từ analytics-service & payment-service"
        />

        {/* =====================
            CHỌN LOẠI BÁO CÁO
        ====================== */}
        <Section title="Chọn loại báo cáo">
          <div className="flex flex-wrap gap-3">
            {REPORT_TYPES.map((r) => (
              <button
                key={r.key}
                onClick={() => setReportType(r.key)}
                className={`px-4 py-2 rounded-lg border text-sm w-full md:w-auto transition ${
                  reportType === r.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="font-semibold">{r.label}</div>
                <div className="text-xs opacity-80">{r.desc}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* =====================
            THAM SỐ TRUY VẤN
        ====================== */}
        <Section title="Tham số truy vấn">
          <div className="bg-white rounded-xl border shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            {/* FROM */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Từ ngày (yyyy-MM-dd)
              </label>
              <input
                type="date"
                value={params.from}
                onChange={(e) => setParam("from", e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            {/* TO */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Đến ngày (yyyy-MM-dd)
              </label>
              <input
                type="date"
                value={params.to}
                onChange={(e) => setParam("to", e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            {/* Station ID */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Station ID (optional)
              </label>
              <input
                value={params.stationId}
                onChange={(e) => setParam("stationId", e.target.value)}
                placeholder="UUID trạm"
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            {/* User ID */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                User ID (cho báo cáo User)
              </label>
              <input
                value={params.userId}
                onChange={(e) => setParam("userId", e.target.value)}
                placeholder="UUID user"
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            {reportType === "revenue" && (
              <div className="md:col-span-4">
                <label className="block text-xs text-slate-500 mb-1">
                  Group by
                </label>
                <select
                  value={params.groupBy}
                  onChange={(e) => setParam("groupBy", e.target.value)}
                  className="border rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="station">Station</option>
                </select>
              </div>
            )}

            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Đang tải..." : "Lấy dữ liệu"}
              </button>
            </div>
          </div>
        </Section>

        {/* =====================
            BẢNG KẾT QUẢ
        ====================== */}
        <Section title="Kết quả">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {columns.length === 0 ? (
            <p className="text-sm text-slate-500">
              Chưa có dữ liệu. Chọn tham số và bấm “Lấy dữ liệu”.
            </p>
          ) : (
            <Table columns={columns} rows={rows} />
          )}
        </Section>
      </div>
    </div>
  );
}
