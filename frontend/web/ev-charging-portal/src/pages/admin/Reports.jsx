import { useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import apiClient from "@/api/apiClient";

// Cấu hình các loại report
const REPORT_TYPES = [
  {
    key: "revenue",
    label: "Doanh thu",
    description: "Báo cáo doanh thu theo khoảng thời gian / trạm.",
    endpoint: "/api/v1/analytics/reports/revenue",
  },
  {
    key: "user",
    label: "Theo người dùng",
    description: "Báo cáo chi phí & usage theo user (theo tháng).",
    endpoint: "/api/v1/analytics/reports/user",
  },
  {
    key: "station",
    label: "Theo trạm",
    description: "Báo cáo sessions / kWh theo trạm (theo ngày).",
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

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState("");

  const currentConfig = REPORT_TYPES.find((r) => r.key === reportType);

  const handleChangeParams = (field, value) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  const buildRequest = () => {
    if (!currentConfig) return null;

    if (reportType === "revenue") {
      return {
        url: currentConfig.endpoint,
        query: {
          station_id: params.stationId || undefined,
          from: params.from,
          to: params.to,
          group_by: params.groupBy,
        },
      };
    }

    if (reportType === "user") {
      if (!params.userId) {
        throw new Error("Vui lòng nhập User ID.");
      }
      return {
        url: `${currentConfig.endpoint}/${params.userId}/monthly`,
        query: {
          month: params.from.slice(0, 7), // yyyy-MM
        },
      };
    }

    if (reportType === "station") {
      if (!params.stationId) {
        throw new Error("Vui lòng nhập Station ID.");
      }
      return {
        url: `${currentConfig.endpoint}/${params.stationId}/daily`,
        query: {
          date: params.from,
        },
      };
    }

    return null;
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");
      setRows([]);
      setColumns([]);

      const cfg = buildRequest();
      if (!cfg) return;

      const res = await apiClient.get(cfg.url, { params: cfg.query });
      const data = res.data;

      if (reportType === "revenue") {
        const items = data.items || data.daily || [];
        setColumns(["Ngày", "Doanh thu (VND)"]);
        setRows(
          items.map((d) => [
            d.date,
            d.total_revenue?.toLocaleString("vi-VN") || 0,
          ])
        );
      } else if (reportType === "user") {
        setColumns(["User ID", "Tổng phiên", "Tổng kWh", "Tổng chi phí (VND)"]);
        setRows([
          [
            data.user_id,
            data.total_sessions,
            data.total_kwh,
            data.total_cost?.toLocaleString("vi-VN") || 0,
          ],
        ]);
      } else if (reportType === "station") {
        const sessions = data.sessions || [];
        setColumns(["Session ID", "User", "Bắt đầu", "KWh", "Chi phí (VND)"]);
        setRows(
          sessions.map((s) => [
            s.id,
            s.user_id,
            s.start_time,
            s.energy_kwh,
            s.cost?.toLocaleString("vi-VN") || 0,
          ])
        );
      }
    } catch (err) {
      console.error("[Reports] error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải dữ liệu báo cáo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Báo cáo chi tiết"
          subtitle="Chọn loại report và tham số. Dữ liệu lấy trực tiếp từ API analytics."
        />

        {/* Chọn loại report */}
        <Section title="Chọn loại báo cáo">
          <div className="flex flex-wrap gap-3">
            {REPORT_TYPES.map((r) => (
              <button
                key={r.key}
                onClick={() => setReportType(r.key)}
                className={`px-4 py-2 rounded-lg border text-sm text-left w-full md:w-auto ${
                  reportType === r.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="font-semibold">{r.label}</div>
                <div className="text-xs opacity-80">{r.description}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* Tham số filter */}
        <Section title="Tham số truy vấn">
          <div className="bg-white rounded-xl border shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Từ ngày (yyyy-MM-dd)
              </label>
              <input
                type="date"
                value={params.from}
                onChange={(e) => handleChangeParams("from", e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Đến ngày (yyyy-MM-dd)
              </label>
              <input
                type="date"
                value={params.to}
                onChange={(e) => handleChangeParams("to", e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Station ID (tuỳ chọn)
              </label>
              <input
                value={params.stationId}
                onChange={(e) =>
                  handleChangeParams("stationId", e.target.value)
                }
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
                placeholder="Lọc theo trạm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                User ID (cho báo cáo User)
              </label>
              <input
                value={params.userId}
                onChange={(e) => handleChangeParams("userId", e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
                placeholder="UUID user"
              />
            </div>

            {reportType === "revenue" && (
              <div className="md:col-span-4">
                <label className="block text-xs text-slate-500 mb-1">
                  Group by
                </label>
                <select
                  value={params.groupBy}
                  onChange={(e) =>
                    handleChangeParams("groupBy", e.target.value)
                  }
                  className="border rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="station">Station</option>
                </select>
              </div>
            )}

            <div className="md:col-span-4 flex justify-end items-end">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Đang tải..." : "Lấy dữ liệu"}
              </button>
            </div>
          </div>
        </Section>

        {/* Bảng kết quả */}
        <Section title="Kết quả">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          {columns.length === 0 ? (
            <p className="text-sm text-slate-500">
              Chưa có dữ liệu. Hãy chọn tham số và bấm &quot;Lấy dữ liệu&quot;.
            </p>
          ) : (
            <Table columns={columns} rows={rows} />
          )}
        </Section>
      </div>
    </div>
  );
}
