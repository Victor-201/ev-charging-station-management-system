import { useMemo, useState, useEffect } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
// Bỏ PDF fallback, chỉ dùng export từ backend
import { useAnalytics } from "@/hooks/useAnalytics";
import paymentService from "@/services/paymentService";

// PDF fallback bị loại bỏ theo yêu cầu

/**
 * Reports.jsx (Final API-integrated version)
 * - Đồng bộ với analyticsService + paymentService thật
 * - Tự tải sổ cái nếu backend trả file, hoặc tạo PDF fallback
 * - UI gọn gàng, chuẩn dashboard admin
 */

export default function Reports() {
  const { getRevenueReport } = useAnalytics();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [revenue, setRevenue] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [stations, setStations] = useState([]);
  const [dailySeries, setDailySeries] = useState([]); // dữ liệu theo ngày cho biểu đồ
  const [dailyRows, setDailyRows] = useState([]); // bảng theo ngày
  const [avgPerSession, setAvgPerSession] = useState(0);
  const [avgPerStation, setAvgPerStation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  // Kiểm tra phạm vi ngày hợp lệ
  const rangeInvalid = useMemo(() => {
    if (!from || !to) return true;
    return new Date(from) > new Date(to);
  }, [from, to]);

  // 🧭 Lấy dữ liệu khi mount
  useEffect(() => {
    loadReports();
  }, []);

  // 📡 Gọi API chính
  const loadReports = async () => {
    if (rangeInvalid) {
      setToast("⚠️ Phạm vi ngày không hợp lệ");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    setLoading(true);
    try {
      const res = await getRevenueReport({ from, to, groupBy: "day" });
      const data = res?.data ?? [];

      if (Array.isArray(data) && data.length > 0) {
        handleData(data);
        setToast("✅ Dữ liệu doanh thu đã cập nhật!");
      } else {
        // Không hiển thị gì khi không có dữ liệu
        handleData([]);
        setToast("");
      }
    } catch (err) {
      console.error("Lỗi lấy báo cáo:", err);
      handleData([]);
      setToast("");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 2500);
    }
  };

  // Đã bỏ chọn tháng thủ công; chỉ dùng từ ngày đến ngày

  // 🔢 Tính toán dữ liệu thống kê
  const handleData = (arr) => {
    // arr kỳ vọng là mảng theo ngày hoặc phần tử có trường date/day
    const sorted = [...arr].sort((a, b) => new Date(a.date || a.day) - new Date(b.date || b.day));
    const totalRev = sorted.reduce((s, r) => s + (r.revenue || 0), 0);
    const totalSes = sorted.reduce((s, r) => s + (r.sessions || 0), 0);

    setRevenue(totalRev);
    setSessions(totalSes);
    setAvgPerSession(totalSes > 0 ? Math.round(totalRev / totalSes) : 0);
    setAvgPerStation(0);
    setStations([]); // không hiển thị theo trạm nữa ở phần biểu đồ

    // Map sang chuỗi theo ngày cho biểu đồ
    const byDay = sorted
      .filter((x) => x.date || x.day)
      .map((x) => ({ label: x.date || x.day, value: x.revenue || 0 }));
    setDailySeries(byDay);
    setDailyRows(sorted.filter((x) => x.date || x.day));
    setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
  };

  // Bỏ dữ liệu mô phỏng

  // 🧾 Gộp xuất báo cáo (API → Fallback PDF)
  const exportReport = async () => {
    if (rangeInvalid) {
      setToast("⚠️ Phạm vi ngày không hợp lệ");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    if (!dailySeries.length) {
      setToast("ℹ️ Không có dữ liệu để xuất");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    setToast("⏳ Đang tạo báo cáo...");
    try {
      const res = await paymentService.exportLedger({ from, to });
      if (res?.data) {
        const contentType = res.headers?.["content-type"] || "application/octet-stream";
        const blob = new Blob([res.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `EV_Ledger_${from}_to_${to}`;
        a.click();
        a.remove();
        setToast("📤 Đã tải báo cáo");
      }
    } catch (err) {
      console.warn("Không thể xuất sổ cái:", err);
    } finally {
      setTimeout(() => setToast(""), 2500);
    }
  };

  // Bỏ PDF fallback

  // ==================== UI ====================
  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed top-5 right-5 bg-emerald-600 text-white px-4 py-2 rounded-md shadow-md">
          {toast}
        </div>
      )}

      <PageHeader
        title="Báo cáo tài chính & hoạt động"
        subtitle="Theo dõi doanh thu, hiệu suất và xuất sổ cái / PDF"
      />

      <Section
        title="Tổng hợp doanh thu"
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded border px-2 py-1.5"
              max={to}
            />
            <span className="text-sm text-gray-500">đến</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded border px-2 py-1.5"
              min={from}
            />
            <button
              onClick={loadReports}
              disabled={loading || rangeInvalid}
              aria-busy={loading ? "true" : "false"}
              aria-disabled={loading || rangeInvalid ? "true" : "false"}
              className={`bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 ${
                loading || rangeInvalid ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
            <button
              onClick={exportReport}
              disabled={loading || rangeInvalid || !dailySeries.length}
              aria-disabled={loading || rangeInvalid || !dailySeries.length ? "true" : "false"}
              className={`bg-indigo-700 text-white px-3 py-1.5 rounded hover:bg-indigo-800 ${
                loading || rangeInvalid || !dailySeries.length ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              📤 Xuất báo cáo
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="text-center text-gray-500 py-6">Đang tải dữ liệu...</div>
        ) : dailySeries.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            Không có dữ liệu trong khoảng đã chọn.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-6 mt-2 text-sm items-center">
              <p>Tổng doanh thu: <b>{revenue.toLocaleString("vi-VN")} VND</b></p>
              <p>Tổng phiên sạc: <b>{sessions}</b></p>
              <p>TB / phiên: <b>{avgPerSession.toLocaleString("vi-VN")} VND</b></p>
              {/* Bỏ TB / trạm khi không hiển thị theo trạm */}
              <p>Cập nhật lúc: {lastUpdated}</p>
            </div>

            {/* Biểu đồ doanh thu theo ngày */}
            <div className="mt-5">
              <Chart height={260} data={dailySeries} />
            </div>

            {/* Bảng theo ngày */}
            <div className="mt-6 overflow-x-auto border rounded-lg bg-white shadow-sm">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2">Ngày</th>
                    <th className="px-3 py-2 text-right">Doanh thu (VND)</th>
                    <th className="px-3 py-2 text-right">Phiên sạc</th>
                    <th className="px-3 py-2 text-right">Điện (kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRows.map((d, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-3 py-2">{d.date || d.day}</td>
                      <td className="px-3 py-2 text-right">{(d.revenue || 0).toLocaleString("vi-VN")}</td>
                      <td className="px-3 py-2 text-right">{d.sessions || 0}</td>
                      <td className="px-3 py-2 text-right">{(d.energy_kwh || 0).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>
    </div>
  );
}
