// pages/admin/Dashboard.jsx
import React, { useEffect, useMemo } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/Section";
import Chart from "@/components/admin/Chart";
import Table from "@/components/admin/Table";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useChargingControl } from "@/hooks/useChargingControl";
import { useStation } from "@/hooks/useStation";

/**
 * Dashboard tổng quan cho Admin:
 * - Lấy dữ liệu từ AnalyticsProvider: overview, revenue, stationStats
 * - Lấy dữ liệu từ ChargingControlProvider: sessions đang chạy
 * - Lấy danh sách trạm từ StationProvider
 */
export default function AdminDashboard() {
  const {
    overview,
    revenue,
    stationStats,
    loadingOverview,
    loadingAnalytics,
    getOverview,
    getRevenue,
    getStationStats,
    error,
  } = useAnalytics();

  const { sessions } = useChargingControl();
  const { stations, getAll } = useStation();

  // Khi vào trang: gọi API tổng quan
  useEffect(() => {
    // Tổng quan hệ thống (tổng sessions, tổng user, ...)
    getOverview();

    // Doanh thu (ví dụ: 7 ngày gần nhất)
    getRevenue({ range: "last_7_days" });

    // Thống kê trạm (nếu backend cần id cụ thể có thể truyền sau)
    getStationStats("all");

    // Lấy danh sách trạm (gần khu vực chẳng hạn)
    getAll({ lat: 10.9, lng: 106.8, radius: 50 }); // tuỳ backend
  }, [getOverview, getRevenue, getStationStats, getAll]);

  // Tính toán metric từ dữ liệu tổng quan
  const kpi = useMemo(() => {
    const o = overview || {};
    return [
      {
        key: "stations",
        title: "Số trạm",
        value: o.total_stations ?? stations?.length ?? 0,
        sub: "Trạm sạc đang quản lý",
      },
      {
        key: "active_sessions",
        title: "Phiên đang sạc",
        value: o.active_sessions ?? (sessions?.length || 0),
        sub: "Đang hoạt động",
      },
      {
        key: "energy",
        title: "Năng lượng hôm nay",
        value: o.energy_today_kwh ?? 0,
        sub: "kWh đã tiêu thụ",
      },
      {
        key: "revenue",
        title: "Doanh thu hôm nay",
        value: o.revenue_today ?? revenue?.today ?? 0,
        sub: "VNĐ",
      },
    ];
  }, [overview, revenue, stations, sessions]);

  // Chuẩn hoá data cho biểu đồ doanh thu
  const revenueChartData = useMemo(() => {
    if (!revenue?.series || !Array.isArray(revenue.series)) return [];
    return revenue.series.map((item) => ({
      label: item.label || item.date,
      value: item.total || item.amount || 0,
    }));
  }, [revenue]);

  if (loadingOverview || loadingAnalytics) {
    return (
      <div className="p-6">
        <PageHeader
          title="Bảng điều khiển Admin"
          subtitle="Đang tải dữ liệu tổng quan..."
        />
        <div className="mt-6 text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Bảng điều khiển Admin"
        subtitle="Tổng quan nhanh về hệ thống sạc EV"
      />

      {/* Hiển thị lỗi chung nếu có */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Lỗi:</strong>{" "}
          {error.message || error.toString() || "Có lỗi xảy ra khi tải dữ liệu"}
        </div>
      )}

      {/* KPI Cards */}
      <Section title="Chỉ số chính trong ngày">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpi.map((item) => (
            <div
              key={item.key}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-1"
            >
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                {item.title}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {item.key === "revenue"
                  ? item.value.toLocaleString("vi-VN")
                  : item.value}
              </div>
              <div className="text-xs text-gray-400">{item.sub}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Biểu đồ doanh thu */}
      <Section title="Doanh thu gần đây">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Chart component của bạn – nhận data dạng {label, value} */}
            <Chart
              title="Doanh thu theo ngày"
              data={revenueChartData}
              yLabel="VNĐ"
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-sm space-y-2">
            <div className="font-semibold text-gray-900 mb-2">
              Tóm tắt doanh thu
            </div>
            <div className="flex justify-between">
              <span>Hôm nay</span>
              <span className="font-bold">
                {revenue?.today
                  ? revenue.today.toLocaleString("vi-VN")
                  : "0"}{" "}
                VNĐ
              </span>
            </div>
            <div className="flex justify-between">
              <span>7 ngày qua</span>
              <span className="font-bold">
                {revenue?.last_7_days
                  ? revenue.last_7_days.toLocaleString("vi-VN")
                  : "0"}{" "}
                VNĐ
              </span>
            </div>
            <div className="flex justify-between">
              <span>30 ngày qua</span>
              <span className="font-bold">
                {revenue?.last_30_days
                  ? revenue.last_30_days.toLocaleString("vi-VN")
                  : "0"}{" "}
                VNĐ
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* Danh sách phiên đang hoạt động */}
      <Section title="Phiên sạc đang hoạt động">
        <Table
          columns={[
            "Session ID",
            "User",
            "Trạm",
            "Cổng",
            "Trạng thái",
            "Bắt đầu lúc",
          ]}
          rows={(sessions || []).map((s) => [
            s.session_id || s.id,
            s.user_name || s.user_id || "—",
            s.station_name || s.station_id || "—",
            s.connector_id || s.point_id || "—",
            s.status || "—",
            s.started_at
              ? new Date(s.started_at).toLocaleString("vi-VN")
              : "—",
          ])}
        />
      </Section>

      {/* Danh sách trạm tóm tắt */}
      <Section title="Danh sách trạm sạc">
        <Table
          columns={["ID", "Tên trạm", "Số trụ", "Cập nhật gần nhất"]}
          rows={(stations || []).map((st) => [
            st.id || st.station_id,
            st.name,
            String(st.chargers?.length || 0),
            st.lastUpdated ||
              (st.updated_at
                ? new Date(st.updated_at).toLocaleString("vi-VN")
                : "—"),
          ])}
        />
      </Section>
    </div>
  );
}
