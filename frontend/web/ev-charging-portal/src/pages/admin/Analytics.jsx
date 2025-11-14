// pages/admin/Analytics.jsx
import React, { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/Section";
import Chart from "@/components/admin/Chart";
import Table from "@/components/admin/Table";
import { useAnalytics } from "@/hooks/useAnalytics";

/**
 * Trang Analytics:
 * - Dùng useAnalytics để gọi:
 *   + getRevenueReport
 *   + getStationDailyReport
 *   + getUserMonthlyReport
 *   + getForecastByStation
 * - Cho phép admin chọn trạm / user / khoảng thời gian và xem biểu đồ.
 */
export default function AnalyticsPage() {
  const {
    loadingAnalytics,
    error,
    revenueReport,
    stationDailyReport,
    userMonthlyReport,
    forecastByStation,
    getRevenueReport,
    getStationDailyReport,
    getUserMonthlyReport,
    getForecastByStation,
  } = useAnalytics();

  // state filter UI
  const [stationId, setStationId] = useState("");
  const [userId, setUserId] = useState("");
  const [range, setRange] = useState("last_7_days");

  // Khi vào trang -> load doanh thu mặc định
  useEffect(() => {
    getRevenueReport({ range: "last_7_days" });
  }, [getRevenueReport]);

  const handleRefreshRevenue = () => {
    getRevenueReport({ range });
  };

  const handleFetchStationReport = () => {
    if (!stationId) return;
    getStationDailyReport(stationId);
    getForecastByStation(stationId);
  };

  const handleFetchUserReport = () => {
    if (!userId) return;
    getUserMonthlyReport(userId);
  };

  // Chuẩn hoá data cho Chart doanh thu
  const revenueChartData = (revenueReport?.points || []).map((p) => ({
    label: p.label || p.date,
    value: p.total || p.amount || 0,
  }));

  const stationEnergyData = (stationDailyReport?.points || []).map((p) => ({
    label: p.label || p.date,
    value: p.energy_kwh || 0,
  }));

  const forecastData = (forecastByStation?.points || []).map((p) => ({
    label: p.label || p.date,
    value: p.predicted || p.forecast || 0,
  }));

  const userUsageData = (userMonthlyReport?.points || []).map((p) => ({
    label: p.label || p.month,
    value: p.energy_kwh || p.sessions || 0,
  }));

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Phân tích & Thống kê"
        subtitle="Xem xu hướng sử dụng, doanh thu và dự báo tải trạm"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Lỗi:</strong>{" "}
          {error.message || error.toString() || "Có lỗi xảy ra khi lấy dữ liệu"}
        </div>
      )}

      {/* Bộ lọc chính */}
      <Section title="Bộ lọc dữ liệu">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lọc doanh thu */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">
              Khoảng thời gian doanh thu
            </div>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="last_7_days">7 ngày qua</option>
              <option value="last_30_days">30 ngày qua</option>
            </select>
            <button
              onClick={handleRefreshRevenue}
              disabled={loadingAnalytics}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Làm mới doanh thu
            </button>
          </div>

          {/* Lọc theo trạm */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">
              Thống kê theo trạm
            </div>
            <input
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              placeholder="Nhập Station ID"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleFetchStationReport}
              disabled={!stationId || loadingAnalytics}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Xem báo cáo trạm
            </button>
          </div>

          {/* Lọc theo user */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">
              Thống kê theo người dùng
            </div>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Nhập User ID"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleFetchUserReport}
              disabled={!userId || loadingAnalytics}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              Xem báo cáo người dùng
            </button>
          </div>
        </div>
      </Section>

      {/* Hàng biểu đồ 1: Doanh thu + Năng lượng theo trạm */}
      <Section title="Doanh thu & Năng lượng">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Chart
            title="Doanh thu theo thời gian"
            data={revenueChartData}
            yLabel="VNĐ"
          />
          <Chart
            title="Năng lượng theo ngày (Trạm)"
            data={stationEnergyData}
            yLabel="kWh"
          />
        </div>
      </Section>

      {/* Hàng biểu đồ 2: Dự báo + User usage */}
      <Section title="Dự báo & Thói quen sử dụng">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Chart
            title="Dự báo tải trạm (forecast)"
            data={forecastData}
            yLabel="kWh (dự kiến)"
          />
          <Chart
            title="Sử dụng theo tháng (User)"
            data={userUsageData}
            yLabel="kWh / số phiên"
          />
        </div>
      </Section>

      {/* Bảng raw – nếu backend trả dạng bảng */}
      {(revenueReport?.rows || []).length > 0 && (
        <Section title="Chi tiết doanh thu (raw)">
          <Table
            columns={revenueReport.columns || ["Ngày", "Doanh thu (VNĐ)"]}
            rows={revenueReport.rows}
          />
        </Section>
      )}
    </div>
  );
}
