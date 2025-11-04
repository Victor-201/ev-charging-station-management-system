export default function ChartPlaceholder({ height = 240 }) {
  return (
    <div
      className="grid place-items-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800"
      style={{ height }}
    >
      Biểu đồ (placeholder)
    </div>
  );
}
