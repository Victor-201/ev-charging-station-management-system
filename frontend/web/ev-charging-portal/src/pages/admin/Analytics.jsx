// pages/admin/Analytics.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Chart from "@/components/admin/Chart";
import apiClient from "@/api/apiClient";

const DEFAULT_RANGE = "30d";

export default function Analytics() {
  // 🔹 Bộ lọc khoảng thời gian
  const [range, setRange] = useState(DEFAULT_RANGE);

  // 🔹 Dữ liệu từ API
  const [stationUsage, setStationUsage] = useState([]);
  const [topStations, setTopStations] = useState([]);
  const [forecast, setForecast] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // Gọi API analytics mỗi khi thay đổi range
  // =========================
  useEffect(() => {
    let isMounted = true;

    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError("");

        // 👉 API gợi ý: tổng hợp metrics cho dashboard analytics
        const res = await apiClient({
          method: "GET",
          url: "/api/v1/analytics/admin/stations",
          params: { range }, // vd: 7d / 30d / 90d
        });

        if (!isMounted) return;
        const data = res.data || {};

        setStationUsage(Array.isArray(data.station_usage) ? data.station_usage : []);
        setTopStations(Array.isArray(data.top_stations) ? data.top_stations : []);
        setForecast(Array.isArray(data.demand_forecast) ? data.demand_forecast : []);
      } catch (err) {
        console.error("Analytics error:", err);
        if (!isMounted) return;
        setError("Không tải được dữ liệu phân tích.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [range]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân tích & thống kê"
        subtitle="Theo dõi hiệu suất trạm sạc, nhu cầu và dự báo"
      />

      {/* Bộ lọc phạm vi thời gian */}
      <Section title="Bộ lọc dữ liệu">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-600">Khoảng thời gian:</span>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {[
              { value: "7d", label: "7 ngày" },
              { value: "30d", label: "30 ngày" },
              { value: "90d", label: "90 ngày" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setRange(item.value)}
                className={`px-3 py-1 text-sm ${
                  range === item.value
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {loading && (
            <span className="text-xs text-gray-500">
              Đang tải dữ liệu...
            </span>
          )}
        </div>
      </Section>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Biểu đồ sản lượng sạc theo ngày */}
      <Section title="Sản lượng sạc theo ngày">
        {loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : stationUsage.length === 0 ? (
          <div className="text-sm text-gray-500">
            Chưa có dữ liệu sản lượng để hiển thị.
          </div>
        ) : (
          <Chart
            type="area"
            data={stationUsage}
            xKey="metric_date"
            yKey="total_kwh"
            height={260}
            label="Tổng kWh"
          />
        )}
      </Section>

      {/* Top trạm theo doanh thu / số phiên sạc */}
      <Section title="Top trạm theo hiệu suất">
        {loading ? (
          <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />
        ) : topStations.length === 0 ? (
          <div className="text-sm text-gray-500">
            Chưa có dữ liệu xếp hạng trạm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Trạm sạc</th>
                  <th className="py-2 pr-4">Số phiên sạc</th>
                  <th className="py-2 pr-4">Tổng kWh</th>
                  <th className="py-2 pr-4">Doanh thu (VND)</th>
                </tr>
              </thead>
              <tbody>
                {topStations.map((s, idx) => (
                  <tr
                    key={s.station_id || idx}
                    className="border-b last:border-b-0"
                  >
                    <td className="py-2 pr-4 text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 pr-4 font-medium">
                      {s.station_name || s.station_id}
                    </td>
                    <td className="py-2 pr-4">
                      {s.total_sessions?.toLocaleString("vi-VN") ?? "--"}
                    </td>
                    <td className="py-2 pr-4">
                      {s.total_kwh?.toLocaleString("vi-VN") ?? "--"}
                    </td>
                    <td className="py-2 pr-4">
                      {s.total_revenue?.toLocaleString("vi-VN") ?? "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Dự báo nhu cầu (AI / forecast) */}
      <Section title="Dự báo nhu cầu sạc (AI)">
        {loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : forecast.length === 0 ? (
          <div className="text-sm text-gray-500">
            Chưa có dữ liệu dự báo. Kiểm tra lại job huấn luyện / ETL.
          </div>
        ) : (
          <Chart
            type="line"
            data={forecast}
            xKey="forecast_date"
            yKey="predicted_sessions"
            height={260}
            label="Số phiên sạc dự kiến"
          />
        )}
      </Section>
    </div>
  );
}
