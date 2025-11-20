// pages/admin/Dashboard.jsx
import { useEffect, useContext, useMemo, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import { PaymentContext } from "@/contexts/PaymentContext";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/* --------------------------- Stat Card --------------------------- */
function StatCard({ label, value, unit, loading, big = false, small = false }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-4 flex flex-col gap-1
      ${big ? "col-span-2" : ""}
      ${small ? "col-span-1" : ""}
    `}
    >
      <span className="text-sm text-gray-500">{label}</span>

      {loading ? (
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
      ) : (
        <span
          className={`font-semibold ${
            big ? "text-3xl" : small ? "text-xl" : "text-2xl"
          }`}
        >
          {value?.toLocaleString("vi-VN") ?? "--"}
          {unit ? <span className="text-base text-gray-500 ml-1">{unit}</span> : null}
        </span>
      )}
    </div>
  );
}

/* --------------------------- Formatters --------------------------- */
const formatCurrencyVND = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatYAxis = (v) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "m";
  if (v >= 1000) return (v / 1000).toFixed(0) + "k";
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
  /* ======================== LẤY TỪ CONTEXT ======================== */
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
  } = useContext(PaymentContext);

  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  /* ======================== LOAD REVENUES ======================== */
  useEffect(() => {
    getTodayRevenue();
    getDailyRevenue();
    getMonthlyRevenue();
    getSummaryRevenue();
  }, [
    getTodayRevenue,
    getDailyRevenue,
    getMonthlyRevenue,
    getSummaryRevenue,
  ]);

  /* ======================== DAILY LIST FORMAT ======================== */
  const dailyList = useMemo(() => {
    const raw = dailyRevenue?.daily_revenue ?? {};
    return Object.entries(raw)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [dailyRevenue]);

  /* ======================== MONTHLY LIST FORMAT ======================== */
  const monthlyList = useMemo(() => {
    const raw = monthlyRevenue?.monthly_revenue ?? {};
    return Object.entries(raw)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [monthlyRevenue]);

  /* ======================== LOAD HEALTH ======================== */
  useEffect(() => {
    let ok = true;

    async function loadHealth() {
      try {
        setLoadingHealth(true);
        const res = await fetch("/api/v1/monitoring/health");
        const json = await res.json();
        if (ok) setHealth(json);
      } catch {
        if (ok) setHealth(null);
      } finally {
        if (ok) setLoadingHealth(false);
      }
    }

    loadHealth();
    const id = setInterval(loadHealth, 60000);

    return () => {
      ok = false;
      clearInterval(id);
    };
  }, []);

  const systemStatus = health?.status || "unknown";
  const isSystemOk = ["ok", "UP", "healthy"].includes(systemStatus);

  /* ================================================================== */

  return (
    <div className="space-y-6">
      <PageHeader title="Bảng điều khiển" subtitle="Tổng quan hệ thống trạm sạc EV" />

      {error && (
        <div className="text-sm text-red-600 mb-2">
          {JSON.stringify(error)}
        </div>
      )}

      {/* QUICK STATS */}
      <Section title="Thống kê nhanh">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">

          {/* Doanh thu hôm nay — BIG */}
          <StatCard
            label="Doanh thu hôm nay"
            value={todayRevenue?.today_revenue ?? 0}
            unit="VND"
            loading={loadingRevenue.today}
            big
          />

          {/* Tổng doanh thu — BIG */}
          <StatCard
            label="Tổng doanh thu"
            value={summaryRevenue?.total_revenue ?? 0}
            unit="VND"
            loading={loadingRevenue.summary}
            big
          />

          {/* Tổng số giao dịch — SMALL */}
          <StatCard
            label="Tổng số giao dịch"
            value={summaryRevenue?.total_transactions ?? 0}
            loading={loadingRevenue.summary}
            small
          />
        </div>
      </Section>

      {/* ------------------------- Biểu đồ tháng ------------------------- */}
      <Section title="Biểu đồ doanh thu theo tháng (12 tháng gần nhất)">
        {loadingRevenue.monthly ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : monthlyList.length === 0 ? (
          <div className="text-sm text-gray-500">Không có dữ liệu.</div>
        ) : (
          <div className="w-full border border-gray-200 rounded-md bg-white p-3 shadow-sm">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={monthlyList}
                margin={{ top: 15, right: 25, left: 10, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  tickFormatter={formatMonth}
                />
                <YAxis tick={{ fill: "#6b7280" }} tickFormatter={formatYAxis} />
                <Tooltip
                  formatter={(value) => formatCurrencyVND(value)}
                  labelFormatter={(label) => `Tháng ${formatMonth(label)}`}
                />
                <Bar
                  dataKey="total"
                  name="Doanh thu (VND)"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* DAILY LIST */}
      <Section title="Doanh thu theo ngày">
        {loadingRevenue.daily ? (
          <div className="h-40 bg-gray-100 animate-pulse rounded-xl" />
        ) : (
          <div className="overflow-auto bg-white rounded-xl shadow-sm p-4">
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-2">Ngày</th>
                  <th className="py-2">Doanh thu (VND)</th>
                </tr>
              </thead>
              <tbody>
                {dailyList.map((row) => (
                  <tr key={row.date} className="border-t">
                    <td className="py-2">{row.date}</td>
                    <td className="py-2 font-medium">
                      {row.total.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* MONTHLY LIST */}
      <Section title="Doanh thu theo tháng">
        {loadingRevenue.monthly ? (
          <div className="h-40 bg-gray-100 animate-pulse rounded-xl" />
        ) : (
          <div className="overflow-auto bg-white rounded-xl shadow-sm p-4">
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-2">Tháng</th>
                  <th className="py-2">Doanh thu (VND)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyList.map((row) => (
                  <tr key={row.month} className="border-t">
                    <td className="py-2">{formatMonth(row.month)}</td>
                    <td className="py-2 font-medium">
                      {row.total.toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* HEALTH */}
      <Section title="Trạng thái hệ thống">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Tình trạng chung</span>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                isSystemOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {loadingHealth
                ? "Đang kiểm tra..."
                : isSystemOk
                ? "Hoạt động ổn định"
                : "Có cảnh báo"}
            </span>
          </div>

          <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-40">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      </Section>
    </div>
  );
}
