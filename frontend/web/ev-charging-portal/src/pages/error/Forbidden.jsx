// src/pages/Forbidden.jsx
import { useEffect, useState } from "react";
import { ShieldAlert, RotateCw } from "lucide-react";

const Forbidden = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ Giả lập trạng thái hệ thống (mock prototype)
  const simulateHealth = () => {
    setLoading(true);
    setErr("");
    setTimeout(() => {
      const ok = Math.random() > 0.25; // 75% ổn định
      setHealth({
        ok,
        message: ok
          ? "Hệ thống hoạt động ổn định và sẵn sàng phục vụ."
          : "Một số dịch vụ đang bảo trì, vui lòng thử lại sau vài phút.",
      });
      setLoading(false);
    }, 600);
  };

  useEffect(() => {
    simulateHealth();
  }, []);

  const Dot = ({ ok }) => (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-2 ${
        ok ? "bg-green-500" : "bg-red-500"
      }`}
    />
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-gradient-to-b from-gray-50 to-gray-100 px-6">
      <div className="flex flex-col items-center">
        <ShieldAlert className="text-orange-600 w-16 h-16 mb-4" />
        <h1 className="text-6xl font-extrabold text-orange-600">403</h1>
        <p className="text-lg mt-3 text-gray-700 font-medium">
          Bạn không có quyền truy cập vào trang này.
        </p>
        <p className="text-sm text-gray-500 mt-1 max-w-md">
          Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây là lỗi.
        </p>
      </div>

      {/* System Status */}
      <div className="mt-6 text-sm text-gray-600 bg-white border rounded-lg px-4 py-3 shadow-sm max-w-md w-full">
        <div className="flex items-center justify-center">
          <Dot ok={Boolean(health?.ok)} />
          <span>
            Trạng thái hệ thống:{" "}
            {loading
              ? "Đang kiểm tra..."
              : health?.ok
              ? "Bình thường"
              : "Không ổn định"}
          </span>
        </div>

        {err && <div className="mt-2 text-red-600">{err}</div>}

        {health?.message && (
          <div className="mt-2 text-gray-500 text-sm">{health.message}</div>
        )}

        <button
          onClick={simulateHealth}
          className="mt-3 text-xs flex items-center justify-center gap-1 px-3 py-1 border rounded hover:bg-gray-50 transition disabled:opacity-50"
          disabled={loading}
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Đang tải..." : "Thử kiểm tra lại"}
        </button>
      </div>

      <div className="mt-8 flex gap-3 flex-wrap justify-center">
        <a
          href="/"
          className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          Về trang chủ
        </a>
        <a
          href="/login"
          className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          Đăng nhập lại
        </a>
      </div>
    </div>
  );
};

export default Forbidden;
