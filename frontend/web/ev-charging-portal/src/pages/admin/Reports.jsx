// pages/admin/Reports.jsx
import { useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import apiClient from "@/api/apiClient";

// =============================
// LOẠI BÁO CÁO
// =============================
const REPORT_TYPES = [
  {
    key: "revenue",
    label: "Doanh thu",
    desc: "Báo cáo tổng doanh thu theo tháng.",
  },
  {
    key: "user",
    label: "Theo người dùng",
    desc: "Báo cáo tổng chi phí & số phiên theo tháng.",
  },
  {
    key: "station",
    label: "Theo trạm",
    desc: "Báo cáo daily station (kWh, sessions, revenue).",
  },
];

// =============================
// HÀM LẤY FROM/TO THEO THÁNG
// =============================
function getRange(monthStr) {
  if (!monthStr) return {};

  const [y, m] = monthStr.split("-");
  const year = Number(y);
  const month = Number(m);

  const lastDay = new Date(year, month, 0).getDate();

  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${String(lastDay).padStart(2, "0")}`,
  };
}

export default function Reports() {
  const [reportType, setReportType] = useState("revenue");
  const [params, setParams] = useState({
    month: new Date().toISOString().slice(0, 7),
  });

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =============================
  // XÂY DỰNG REQUEST THEO API THẬT
  // =============================
  const buildRequest = () => {
    const { month } = params;

    // REVENUE — API thật yêu cầu from/to
    if (reportType === "revenue") {
      const { from, to } = getRange(month);
      return {
        url: "/api/v1/analytics/reports/revenue",
        query: { from, to },
      };
    }

    // USER MONTHLY — bạn yêu cầu system-wide → endpoint aggregate
    return {
      url: "/api/v1/analytics/reports/user/monthly",
      query: { month },
    };

    // STATION DAILY — bạn yêu cầu system-wide → endpoint aggregate
    if (reportType === "station") {
      return {
        url: "/api/v1/analytics/reports/station/daily",
        query: { date: `${month}-01` },
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
      setColumns([]);
      setRows([]);

      const req = buildRequest();
      const res = await apiClient.get(req.url, { params: req.query });
      const data = res.data ?? {};

      // ======== REVENUE ========
      if (reportType === "revenue") {
        setColumns(["Tổng doanh thu (VND)"]);
        setRows([[data.total_revenue?.toLocaleString("vi-VN") ?? "0"]]);
        return;
      }

      // ======== USER MONTHLY ========
      if (reportType === "user") {
        setColumns(["Tháng", "Tổng chi phí", "Số phiên"]);
        setRows([
          [
            data.month ?? params.month,
            data.total_cost?.toLocaleString("vi-VN") ?? "0",
            data.sessions ?? 0,
          ],
        ]);
        return;
      }

      // ======== STATION DAILY ========
      if (reportType === "station") {
        setColumns(["Ngày", "Tổng kWh", "Số phiên", "Doanh thu"]);
        setRows([
          [
            data.date ?? `${params.month}-01`,
            data.total_kwh ?? 0,
            data.sessions ?? 0,
            data.revenue?.toLocaleString("vi-VN") ?? "0",
          ],
        ]);
        return;
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Không thể tải báo cáo."
      );
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">

        <PageHeader
          title="Báo cáo"
          subtitle="Dữ liệu trực tiếp từ analytics-service"
        />

        {/* ========== CHỌN LOẠI REPORT ========== */}
        <Section title="Chọn loại báo cáo">
          <div className="flex flex-wrap gap-3">
            {REPORT_TYPES.map((r) => (
              <button
                key={r.key}
                onClick={() => setReportType(r.key)}
                className={`px-4 py-2 rounded-lg border text-sm transition ${
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

        {/* ========== PARAMS ========== */}
        <Section title="Tham số truy vấn">
          <div className="bg-white rounded-xl border shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Chọn tháng (YYYY-MM)
              </label>
              <input
                type="month"
                value={params.month}
                onChange={(e) =>
                  setParams((p) => ({ ...p, month: e.target.value }))
                }
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div className="md:col-span-3 flex justify-end">
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

        {/* ========== RESULT TABLE ========== */}
        <Section title="Kết quả">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {columns.length === 0 ? (
            <p className="text-sm text-slate-500">
              Chưa có dữ liệu. Hãy chọn tháng và bấm “Lấy dữ liệu”.
            </p>
          ) : (
            <Table columns={columns} rows={rows} />
          )}
        </Section>

      </div>
    </div>
  );
}
