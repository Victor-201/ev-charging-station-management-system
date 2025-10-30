import { useState } from "react";
import analyticsAPI from "../api/analyticsAPI";
import jsPDF from "jspdf";

function Reports() {
  const [downloading, setDownloading] = useState(false);

  const exportPDF = async () => {
    try {
      setDownloading(true);
      // Nếu backend có API export, dùng API; nếu không thì tạo PDF đơn giản phía client
      try {
        const blobRes = await analyticsAPI.export({ type: "revenue" });
        const blob = new Blob([blobRes.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "revenue-report.pdf"; a.click();
        URL.revokeObjectURL(url);
        return;
      } catch (_) {
        // Fallback: tự tạo PDF
        const doc = new jsPDF();
        doc.text("EV Admin - Revenue Report", 14, 16);
        doc.text("Generated at: " + new Date().toLocaleString("vi-VN"), 14, 24);
        doc.save("revenue-report.pdf");
      }
    } finally {
      setDownloading(false);
    }
  };

  const exportCSV = async () => {
    // Fallback CSV đơn giản
    const headers = ["date, sessions, revenue"];
    const rows = [
      "2025-10-01, 120, 15200000",
      "2025-10-02, 98, 12100000",
      "2025-10-03, 130, 18400000",
    ];
    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sessions.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-ev-gunmetal">Reports</h2>
        <p className="text-sm text-ev-deep/70">
          Tổng hợp KPI, doanh thu theo ngày, hiệu suất trạm và dữ liệu xuất khẩu.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6 h-72">
          <h3 className="text-lg font-semibold text-ev-gunmetal">KPI</h3>
          <p className="text-sm text-ev-deep/60">Placeholder bảng số liệu KPI. Sẽ tích hợp dữ liệu thật sau.</p>
        </div>
        <div className="panel p-6 h-72">
          <h3 className="text-lg font-semibold text-ev-gunmetal">Phiên sạc theo ngày - 14 ngày</h3>
          <p className="text-sm text-ev-deep/60">Placeholder biểu đồ cột/đường.</p>
        </div>
        <div className="panel p-6 h-72 lg:col-span-2">
          <h3 className="text-lg font-semibold text-ev-gunmetal">Xuất dữ liệu</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <button onClick={exportPDF} disabled={downloading} className="px-4 py-3 text-sm font-medium rounded-xl bg-ev-teal text-white hover:bg-ev-deep transition-colors disabled:opacity-60">
              {downloading ? "Đang tạo PDF..." : "Tải báo cáo doanh thu (PDF)"}
            </button>
            <button onClick={exportCSV} className="px-4 py-3 text-sm font-medium rounded-xl bg-white text-ev-gunmetal border border-ev-deep/20 hover:bg-ev-ice/40 transition-colors">
              Tải chi tiết phiên sạc (CSV)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Reports;
