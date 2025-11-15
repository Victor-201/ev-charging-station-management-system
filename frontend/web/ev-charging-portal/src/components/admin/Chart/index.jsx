import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

/**
 * Biểu đồ cột linh hoạt cho Admin Dashboard
 * @param {Array} data - Mảng dữ liệu [{ label: string, value: number }]
 * @param {number} height - Chiều cao biểu đồ (mặc định 300)
 * @param {string} color - Màu thanh cột (mặc định #2563eb)
 * @param {string} unit - Đơn vị hiển thị tooltip (VD: 'VND', 'kWh', 'Lượt')
 */
export default function Chart({
  data = [],
  height = 300,
  color = "#2563eb",
  unit = "VND",
  type = "bar", // 'bar' | 'line' | 'area'
  xKey = "label",
  yKey = "value",
  label = "Giá trị", // alias for seriesName
  seriesName, // optional explicit series label
}) {
  if (!data || !data.length) {
    return (
      <div
        className="grid place-items-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800"
        style={{ height }}
      >
        Biểu đồ (placeholder)
      </div>
    );
  }

  const formatValue = (value) => {
    if (unit === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(value);
    }
    return `${value} ${unit}`;
  };

  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey={xKey} tick={{ fill: "#6b7280" }} />
      <YAxis tick={{ fill: "#6b7280" }} />
      <Tooltip formatter={(value) => formatValue(value)} />
      <Legend />
    </>
  );

  const name = seriesName || label || "Giá trị";

  return (
    <div className="w-full border border-gray-200 rounded-md bg-white dark:bg-gray-900 p-3 shadow-sm">
      <ResponsiveContainer width="100%" height={height}>
        {type === "line" ? (
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            {common}
            <Line type="monotone" dataKey={yKey} stroke={color} name={name} dot={false} strokeWidth={2} />
          </LineChart>
        ) : type === "area" ? (
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            {common}
            <Area type="monotone" dataKey={yKey} stroke={color} fill={color} fillOpacity={0.15} name={name} />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            {common}
            <Bar dataKey={yKey} fill={color} name={name} radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
