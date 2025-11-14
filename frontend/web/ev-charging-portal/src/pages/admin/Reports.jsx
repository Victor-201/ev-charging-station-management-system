// pages/admin/Reports.jsx
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";
import { useAnalytics } from "@/hooks/useAnalytics";
import { usePayment } from "@/hooks/usePayment";

/**
 * Trang Báo cáo:
 * - Dùng Analytics để xem:
 *   + logs hệ thống
 *   + alerts (cảnh báo)
 * - Dùng Payment để export sổ cái (ledger) dạng tổng hợp
 */
export default function ReportsPage() {
  const {
    loadingMonitoring,
    error,
    logs,
    alerts,
    getLogs,
    getAlerts,
    ackAlert,
  } = useAnalytics();

  const { exportLedger, loadingLedger } = usePayment();

  const [logLevel, setLogLevel] = useState("info");
  const [ledgerRange, setLedgerRange] = useState("last_7_days");
  const [ledgerResult, setLedgerResult] = useState(null);

  // Lấy logs & alerts khi vào trang
  useEffect(() => {
    getLogs({ level: logLevel });
    getAlerts();
  }, [getLogs, getAlerts, logLevel]);

  const handleAck = async (alert) => {
    await ackAlert({ id: alert.id });
    await getAlerts();
  };

  const handleExportLedger = async () => {
    try {
      const res = await exportLedger({ range: ledgerRange });
      setLedgerResult(res.data || res); // tuỳ backend
    } catch {
      // lỗi đã được PaymentProvider set error
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Báo cáo & Nhật ký hệ thống"
        subtitle="Xem log, cảnh báo và xuất báo cáo tài chính"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Lỗi:</strong>{" "}
          {error.message || error.toString() || "Có lỗi xảy ra khi tải dữ liệu"}
        </div>
      )}

      {/* Bộ lọc log + xuất ledger */}
      <Section title="Bộ lọc báo cáo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filter log level */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Mức log cần xem
            </div>
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
            <div className="mt-2 text-xs text-gray-500">
              Hệ thống sẽ gọi <code>getLogs({"{ level }"})</code> từ
              AnalyticsProvider
            </div>
          </div>

          {/* Export ledger */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Xuất báo cáo sổ cái (Ledger)
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={ledgerRange}
                onChange={(e) => setLedgerRange(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="today">Hôm nay</option>
                <option value="last_7_days">7 ngày qua</option>
                <option value="last_30_days">30 ngày qua</option>
                <option value="this_month">Tháng này</option>
              </select>
              <button
                onClick={handleExportLedger}
                disabled={loadingLedger}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {loadingLedger ? "Đang xuất..." : "Xuất ledger"}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Dữ liệu trả về được lưu trong <code>ledgerResult</code> (tuỳ backend
              định nghĩa).
            </div>
          </div>
        </div>
      </Section>

      {/* Bảng logs */}
      <Section title="Nhật ký hệ thống (Logs)">
        {loadingMonitoring ? (
          <div className="text-gray-500 text-sm">Đang tải log...</div>
        ) : (
          <Table
            columns={["Thời gian", "Level", "Nguồn", "Thông điệp"]}
            rows={(logs || []).map((log, idx) => [
              log.timestamp
                ? new Date(log.timestamp).toLocaleString("vi-VN")
                : `#${idx}`,
              log.level || "info",
              log.source || log.service || "—",
              log.message || log.msg || "—",
            ])}
          />
        )}
      </Section>

      {/* Bảng alerts */}
      <Section title="Cảnh báo (Alerts)">
        {loadingMonitoring ? (
          <div className="text-gray-500 text-sm">Đang tải cảnh báo...</div>
        ) : (alerts || []).length === 0 ? (
          <div className="text-sm text-gray-500">Chưa có cảnh báo nào.</div>
        ) : (
          <div className="space-y-2">
            {(alerts || []).map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-amber-900">
                    {a.title || "Cảnh báo hệ thống"}
                  </div>
                  <div className="text-amber-800">{a.message || a.detail}</div>
                  <div className="text-xs text-amber-700">
                    Mức: {a.severity || a.level || "N/A"} •{" "}
                    {a.created_at
                      ? new Date(a.created_at).toLocaleString("vi-VN")
                      : "—"}
                  </div>
                </div>
                {!a.acknowledged && (
                  <button
                    onClick={() => handleAck(a)}
                    className="ml-4 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    Đã xử lý
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Kết quả ledger raw */}
      {ledgerResult && (
        <Section title="Kết quả xuất Ledger (raw)">
          <pre className="max-h-80 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
            {JSON.stringify(ledgerResult, null, 2)}
          </pre>
        </Section>
      )}
    </div>
  );
}
