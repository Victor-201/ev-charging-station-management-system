import { ChartNoAxesCombined } from "lucide-react";

export default function StatCard({ title, value, icon: Icon = ChartNoAxesCombined, trend }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600/10 text-emerald-600">
          <Icon size={20} />
        </div>
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-xl font-semibold">{value}</div>
          {trend && (
            <div className={`text-xs ${trend.startsWith("+") ? "text-emerald-600" : "text-red-600"}`}>
              {trend} so với tuần trước
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
