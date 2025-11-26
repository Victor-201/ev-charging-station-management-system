import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import { PaymentContext } from "@/contexts/PaymentContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* --------------------------- Stat Card --------------------------- */
function StatCard({ label, value, unit, loading, big = false, small = false }) {
  return (
    <div
      className={`bg-white rounded-xl shadow p-4 flex flex-col gap-1 transition hover:shadow-md
        ${big ? "col-span-2" : ""} ${small ? "col-span-1" : ""}`}
    >
      <span className="text-sm text-gray-500">{label}</span>
      {loading ? (
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
      ) : (
        <span
          className={`font-semibold ${
            big ? "text-3xl" : small ? "text-xl" : "text-2xl"
          }`}
        >
          {value?.toLocaleString("vi-VN") ?? "--"}
          {unit && <span className="text-base text-gray-500 ml-1">{unit}</span>}
        </span>
      )}
    </div>
  );
}

/* --------------------------- Formatters --------------------------- */
const formatCurrencyVND = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v ?? 0);

const formatYAxis = (v) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + "k";
  return v;
};

const formatMonth = (m) => {
  if (!m) return m;
  if (/^\d{4}-\d{2}$/.test(m)) {
    const [y, mm] = m.split("-");
    return `${mm}/${y}`;
  }
  return m;
};

/* ================================================================== */
export default function Dashboard() {
  const {
    todayRevenue,
    dailyRevenue,
    monthlyRevenue,
    summaryRevenue,
    loadingRevenue,
    error,
    getTodayRevenue,
    getDailyRevenue,
    getMonthlyRevenue,
    getSummaryRevenue,
    getRevenueByStation: contextGetRevenueByStation,
    getRevenueByRegion: contextGetRevenueByRegion,
  } = useContext(PaymentContext);

  /* ----------------------- Station & Region Revenue ----------------------- */
  const [stationRevenue, setStationRevenue] = useState([]);
  const [regionRevenue, setRegionRevenue] = useState([]);

  const getRevenueByStation = useCallback(async () => {
    try {
      const res = await contextGetRevenueByStation();
      setStationRevenue(res?.data ?? res ?? []);
    } catch {
      setStationRevenue([]);
    }
  }, [contextGetRevenueByStation]);

  const getRevenueByRegion = useCallback(async () => {
    try {
      const res = await contextGetRevenueByRegion();
      setRegionRevenue(res?.data ?? res ?? []);
    } catch {
      setRegionRevenue([]);
    }
  }, [contextGetRevenueByRegion]);

  /* ----------------------- Load all revenue ----------------------- */
  useEffect(() => {
    getTodayRevenue();
    getDailyRevenue();
    getMonthlyRevenue();
    getSummaryRevenue();
    getRevenueByStation();
    getRevenueByRegion();
  }, [
    getTodayRevenue,
    getDailyRevenue,
    getMonthlyRevenue,
    getSummaryRevenue,
    getRevenueByStation,
    getRevenueByRegion,
  ]);

  /* ----------------------- Daily list (30 days) ----------------------- */
  const dailyList = useMemo(() => {
    const raw = dailyRevenue?.daily_revenue ?? {};
    const today = new Date();
    return Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const dateStr = d.toISOString().slice(0, 10);
      return { date: dateStr, total: raw[dateStr] ?? 0 };
    });
  }, [dailyRevenue]);

  /* ----------------------- Monthly list ----------------------- */
  const monthlyList = useMemo(() => {
    const raw = monthlyRevenue?.monthly_revenue ?? {};
    return Object.entries(raw)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [monthlyRevenue]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điều khiển"
        subtitle="Tổng quan hệ thống trạm sạc EV"
      />

      {error && (
        <div className="text-sm text-red-600 mb-2">{JSON.stringify(error)}</div>
      )}

      {/* Quick Stats */}
      <Section title="Thống kê nhanh">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            label="Doanh thu hôm nay"
            value={todayRevenue?.today_revenue}
            unit="VND"
            loading={loadingRevenue.today}
            big
          />
          <StatCard
            label="Tổng doanh thu"
            value={summaryRevenue?.total_revenue}
            unit="VND"
            loading={loadingRevenue.summary}
            big
          />
          <StatCard
            label="Tổng số giao dịch"
            value={summaryRevenue?.total_transactions}
            loading={loadingRevenue.summary}
            small
          />
        </div>
      </Section>

      {/* Daily Line Chart */}
      <Section title="Doanh thu 30 ngày gần nhất">
        {dailyList.length === 0 ? (
          <div className="h-80 bg-gray-100 animate-pulse rounded-xl" />
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyList}
                margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#1D4ED8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: "#1D4ED8" }}
                  isAnimationActive
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                />
                <YAxis tickFormatter={formatYAxis} tick={{ fill: "#6B7280" }} />
                <Tooltip
                  formatter={(v) => formatCurrencyVND(v)}
                  labelFormatter={(l) => `Ngày: ${l}`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* Monthly Bar Chart */}
      <Section title="Doanh thu theo tháng">
        {loadingRevenue.monthly ? (
          <div className="h-80 bg-gray-100 animate-pulse rounded-xl" />
        ) : monthlyList.length === 0 ? (
          <div className="text-sm text-gray-500">Không có dữ liệu.</div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyList}
                margin={{ top: 20, right: 20, left: 0, bottom: 50 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  tickFormatter={formatMonth}
                />
                <YAxis tickFormatter={formatYAxis} tick={{ fill: "#6B7280" }} />
                <Tooltip
                  formatter={(v) => formatCurrencyVND(v)}
                  labelFormatter={(label) => `Tháng ${formatMonth(label)}`}
                />
                <Bar
                  dataKey="total"
                  radius={[6, 6, 0, 0]}
                  fill="#1D4ED8"
                  isAnimationActive
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* Region Revenue */}

      <Section title="Doanh thu theo vùng">
        {regionRevenue?.length > 0 ? (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionRevenue}
                  dataKey="total_revenue"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) =>
                    `${entry.region}: ${formatYAxis(entry.total_revenue)}`
                  }
                  isAnimationActive
                >
                  {regionRevenue.map((entry, index) => {
                    // Mảng màu cho từng vùng
                    const COLORS = [
                      "#1D4ED8",
                      "#10B981",
                      "#F59E0B",
                      "#8B5CF6",
                      "#F43F5E",
                    ];
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    );
                  })}
                </Pie>
                <Tooltip formatter={(value) => formatCurrencyVND(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Không có dữ liệu.</div>
        )}
      </Section>

      {/* Station Revenue */}
      <Section title="Doanh thu theo trạm">
        {stationRevenue?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stationRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="station_name" tick={{ fill: "#6B7280" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fill: "#6B7280" }} />
              <Tooltip formatter={(v) => formatCurrencyVND(v)} />
              <Bar
                dataKey="total_revenue"
                fill="#1D4ED8"
                isAnimationActive
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-gray-500">Không có dữ liệu.</div>
        )}
      </Section>
    </div>
  );
}
