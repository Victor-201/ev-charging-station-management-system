// pages/admin/Reports.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import apiClient from "@/api/apiClient";

// 🔹 Kiểu báo cáo
const REPORT_TYPES = [
  { value: "revenue", label: "Báo cáo doanh thu" },
  { value: "sessions", label: "Báo cáo phiên sạc" },
  { value: "users", label: "Báo cáo người dùng mới" },
];

export default function Reports() {
  const [reportType, setReportType] = useState("revenue");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // Hàm build URL theo loại báo cáo
  // =========================
  function buildReportUrl() {
    const params = new URLSearchParams();
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);

    switch (reportType) {
      case "revenue":
        return `/api/v1/analytics/reports/revenue?${params.toString()}`;
      case "sessions":
        return `/api/v1/analytics/reports/charging-sessions?${params.toString()}`;
      case "users":
        return `/api/v1/analytics/reports/new-users?${params.toString()}`;
      default:
        return `/api/v1/analytics/reports/revenue?${params.toString()}`;
    }
  }

  async function fetchReport() {
    try {
      setLoading(true);
      setError("");
      setData([]);

      const url = buildReportUrl();
      const res = await apiClient({ method: "GET", url });

      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Report error:", err);
      setError("Không tải được dữ liệu báo cáo.");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Tự tải lần đầu khi mở trang
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo chi tiết"
        subtitle="Trích xuất và xem dữ liệu chi tiết theo thời gian"
      />

      <Section title="Bộ lọc & điều kiện báo cáo">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Loại báo cáo */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Loại báo cáo</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Từ ngày */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Từ ngày</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* Đến ngày */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Đến ngày</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* Nút tải */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={fetchReport}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {loading ? "Đang tải..." : "Xem báo cáo"}
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          * Báo cáo doanh thu và phiên sạc thường được tổng hợp theo ngày.  
          * Báo cáo người dùng hiển thị số lượng user mới đăng ký trong khoảng thời gian.
        </p>
      </Section>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Bảng kết quả */}
      <Section title="Kết quả báo cáo">
        {loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : data.length === 0 ? (
          <div className="text-sm text-gray-500">
            Không có dữ liệu phù hợp với điều kiện lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="py-2 pr-4 capitalize">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    {Object.keys(row).map((key) => (
                      <td key={key} className="py-2 pr-4">
                        {typeof row[key] === "number"
                          ? row[key].toLocaleString("vi-VN")
                          : String(row[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
