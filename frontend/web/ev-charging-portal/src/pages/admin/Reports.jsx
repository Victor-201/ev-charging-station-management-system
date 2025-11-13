import { useMemo, useState, useEffect } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { useAnalytics } from "@/hooks/useAnalytics";
import paymentService from "@/services/paymentService";

pdfMake.vfs = pdfFonts.default.vfs;

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
  const [avgPerSession, setAvgPerSession] = useState(0);
  const [avgPerStation, setAvgPerStation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  // 🧭 Lấy dữ liệu khi mount
  useEffect(() => {
    loadReports();
  }, []);

  // 📡 Gọi API chính
  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await getRevenueReport({ from, to });
      const data = res?.data?.stations ?? res?.data ?? [];

      if (Array.isArray(data) && data.length > 0) {
        handleData(data);
        setToast("✅ Dữ liệu doanh thu đã cập nhật!");
      } else {
        handleData(generateMockData());
        setToast("⚠️ Dữ liệu rỗng, hiển thị mock!");
      }
    } catch (err) {
      console.error("Lỗi lấy báo cáo:", err);
      handleData(generateMockData());
      setToast("⚠️ API lỗi — hiển thị dữ liệu mô phỏng");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 2500);
    }
  };

  // 🔢 Tính toán dữ liệu thống kê
  const handleData = (arr) => {
    const totalRev = arr.reduce((s, r) => s + (r.revenue || 0), 0);
    const totalSes = arr.reduce((s, r) => s + (r.sessions || 0), 0);

    setRevenue(totalRev);
    setSessions(totalSes);
    setAvgPerSession(totalSes > 0 ? Math.round(totalRev / totalSes) : 0);
    setAvgPerStation(arr.length > 0 ? Math.round(totalRev / arr.length) : 0);
    setStations(arr);
    setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
  };

  // 🔧 Dữ liệu mô phỏng khi API lỗi
  const generateMockData = () => [
    { station_id: "ST-01", sessions: 128, revenue: 1850000, energy_kwh: 5400 },
    { station_id: "ST-02", sessions: 145, revenue: 2130000, energy_kwh: 6100 },
    { station_id: "ST-03", sessions: 112, revenue: 1650000, energy_kwh: 4800 },
  ];

  // 🧾 Gộp xuất báo cáo (API → Fallback PDF)
  const exportReport = async () => {
    setToast("⏳ Đang tạo báo cáo...");
    try {
      const res = await paymentService.exportLedger({ from, to }, { responseType: "blob" });
      if (res?.data) {
        // ✅ Tải file thật từ backend
        const contentType = res.headers["content-type"] || "application/octet-stream";
        const ext = contentType.includes("excel") ? "xlsx" : "pdf";
        const blob = new Blob([res.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `EV_Ledger_${from}_to_${to}.${ext}`;
        a.click();
        a.remove();
        setToast(`📤 Đã tải báo cáo (${ext.toUpperCase()})`);
      } else {
        // Fallback PDF nếu không có file
        exportPDF();
      }
    } catch (err) {
      console.warn("Không thể xuất sổ cái, fallback PDF:", err);
      exportPDF();
    } finally {
      setTimeout(() => setToast(""), 2500);
    }
  };

  // 🧩 Fallback PDF xuất báo cáo
  const exportPDF = () => {
    const summary = [
      ["Tổng doanh thu", `${revenue.toLocaleString("vi-VN")} VND`],
      ["Tổng phiên sạc", sessions],
      ["TB / phiên", `${avgPerSession.toLocaleString("vi-VN")} VND`],
      ["TB / trạm", `${avgPerStation.toLocaleString("vi-VN")} VND`],
    ];

    const details = [
      ["#", "Mã trạm", "Phiên sạc", "Điện (kWh)", "Doanh thu (VND)"],
      ...stations.map((s, i) => [
        i + 1,
        s.station_id,
        s.sessions,
        s.energy_kwh?.toLocaleString("vi-VN"),
        s.revenue?.toLocaleString("vi-VN"),
      ]),
    ];

    const docDefinition = {
      content: [
        { text: "EV CHARGING SYSTEM REPORT", style: "header", alignment: "center" },
        { text: `Từ ${from} đến ${to}`, alignment: "center", margin: [0, 4, 0, 10] },
        { text: `Cập nhật lúc: ${lastUpdated}`, fontSize: 9, alignment: "center", margin: [0, 0, 0, 15] },
        { text: "I. TỔNG QUAN", style: "section" },
        { table: { widths: ["*", "*"], body: [["Chỉ số", "Giá trị"], ...summary] }, layout: "lightHorizontalLines" },
        { text: "II. CHI TIẾT THEO TRẠM", style: "section", margin: [0, 10, 0, 4] },
        { table: { headerRows: 1, widths: [20, "*", "*", "*", "*"], body: details }, layout: "lightHorizontalLines" },
        { text: "Generated by EV Charging Admin © 2025", alignment: "center", fontSize: 9, color: "gray", margin: [0, 20, 0, 0] },
      ],
      styles: {
        header: { fontSize: 16, bold: true, color: "#1565c0" },
        section: { fontSize: 12, bold: true, color: "#1976d2" },
      },
      defaultStyle: { fontSize: 10 },
    };

    pdfMake.createPdf(docDefinition).download(`EV_Report_${from}_to_${to}.pdf`);
    setToast("📄 Đã tải PDF báo cáo!");
  };

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
            />
            <span className="text-sm text-gray-500">đến</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded border px-2 py-1.5"
            />
            <button
              onClick={loadReports}
              className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
            >
              Làm mới
            </button>
            <button
              onClick={exportReport}
              className="bg-indigo-700 text-white px-3 py-1.5 rounded hover:bg-indigo-800"
            >
              📤 Xuất báo cáo
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="text-center text-gray-500 py-6">Đang tải dữ liệu...</div>
        ) : stations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">📭 Chưa có dữ liệu báo cáo</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-6 mt-2 text-sm items-center">
              <p>Tổng doanh thu: <b>{revenue.toLocaleString("vi-VN")} VND</b></p>
              <p>Tổng phiên sạc: <b>{sessions}</b></p>
              <p>TB / phiên: <b>{avgPerSession.toLocaleString("vi-VN")} VND</b></p>
              <p>TB / trạm: <b>{avgPerStation.toLocaleString("vi-VN")} VND</b></p>
              <p>Cập nhật lúc: {lastUpdated}</p>
            </div>

            {/* Biểu đồ doanh thu */}
            <div className="mt-5">
              <Chart
                height={260}
                data={stations.map((s) => ({
                  label: s.station_id,
                  value: s.revenue,
                }))}
              />
            </div>

            {/* Bảng chi tiết */}
            <div className="mt-8 overflow-x-auto border rounded-lg bg-white shadow-sm">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-blue-100 text-blue-800 font-semibold">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Trạm</th>
                    <th className="px-3 py-2 text-right">Phiên sạc</th>
                    <th className="px-3 py-2 text-right">Điện (kWh)</th>
                    <th className="px-3 py-2 text-right">Doanh thu (VND)</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((s, i) => (
                    <tr key={s.station_id} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{s.station_id}</td>
                      <td className="px-3 py-2 text-right">{s.sessions}</td>
                      <td className="px-3 py-2 text-right">{s.energy_kwh?.toLocaleString("vi-VN")}</td>
                      <td className="px-3 py-2 text-right">{s.revenue?.toLocaleString("vi-VN")}</td>
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
