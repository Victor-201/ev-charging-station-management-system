import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/staff/Card";
import { ROUTERS } from "@/utils/constants";

export default function Dashboard() {
  const navigate = useNavigate();

  const quickCards = [
    { key: "payments", title: "Payments", subtitle: "Xử lý & ghi nhận", icon: "💳", route: ROUTERS.STAFF.PAYMENTS },
    { key: "stations", title: "Stations", subtitle: "Quản lý trạm sạc", icon: "⚡", route: ROUTERS.STAFF.STATIONS },
    { key: "sessions", title: "Sessions", subtitle: "Phiên đang chạy", icon: "🔋", route: ROUTERS.STAFF.SESSIONS },
    { key: "settings", title: "Settings", subtitle: "Cấu hình hệ thống", icon: "⚙️", route: ROUTERS.STAFF.SETTINGS },
  ];

  const requestCameraThenNavigate = async (to) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      navigate(to);
    } catch (err) {
      console.error("Camera permission denied or error:", err);
      alert("Không thể truy cập camera. Vui lòng cho phép quyền camera và thử lại.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-[#f6f8fb] text-[#0f1724] font-[Inter] px-6 py-9">
      <div className="w-full max-w-[980px] space-y-6">
        <h1 className="text-center text-3xl md:text-4xl font-extrabold mb-6">
          Dashboard
        </h1>

        {/* QR Scan Button */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => requestCameraThenNavigate(ROUTERS.STAFF.SCAN)}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ")
              ? requestCameraThenNavigate(ROUTERS.STAFF.SCAN)
              : null
          }
          aria-label="Quét mã QR để xác nhận lượt sạc"
          className="mx-auto w-full max-w-[640px] h-[220px] bg-gradient-to-br from-sky-400 to-blue-600 text-white 
                     rounded-2xl flex items-center gap-6 px-6 py-4 shadow-2xl border border-white/10 
                     cursor-pointer select-none transition-transform duration-200 hover:-translate-y-2"
        >
          <div className="w-[180px] h-[180px] rounded-xl border-2 border-dashed border-white/20 
                          bg-white/10 flex items-center justify-center">
            <div className="text-6xl">📷</div>
          </div>

          <div className="flex-1">
            <div className="text-2xl font-extrabold mb-1">Quét mã QR</div>
            <div className="text-sm opacity-90">
              Nhấn để mở camera và xác nhận lượt sạc
            </div>
          </div>
        </div>

        {/* 2x2 Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[820px] mx-auto mt-8">
          {quickCards.map((c) => (
            <button
              key={c.key}
              onClick={() => navigate(c.route)} // 👈 Dùng route chuẩn
              aria-label={c.title}
              className="bg-white border border-gray-100 rounded-xl shadow-md flex items-center justify-between gap-4
                         px-5 py-5 min-h-[130px] transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <div
                  className={`w-[84px] h-[84px] flex items-center justify-center text-[44px] rounded-lg shadow-sm 
                    ${
                      c.key === "payments"
                        ? "bg-cyan-50"
                        : c.key === "stations"
                        ? "bg-green-50"
                        : c.key === "sessions"
                        ? "bg-yellow-50"
                        : "bg-purple-50"
                    }`}
                >
                  {c.icon}
                </div>
                <div>
                  <div className="text-lg font-extrabold">{c.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{c.subtitle}</div>
                </div>
              </div>
              <div className="text-blue-600 text-2xl font-bold">→</div>
            </button>
          ))}
        </div>

        {/* Latest Sessions */}
        <div className="mt-10">
          <Card title="Latest Sessions">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="py-2 px-3 text-left font-semibold">Session ID</th>
                  <th className="py-2 px-3 text-left font-semibold">User</th>
                  <th className="py-2 px-3 text-left font-semibold">Station</th>
                  <th className="py-2 px-3 text-left font-semibold">Start</th>
                  <th className="py-2 px-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="py-2 px-3">S-1001</td>
                  <td className="py-2 px-3">Nguyen</td>
                  <td className="py-2 px-3">Station A</td>
                  <td className="py-2 px-3">10:00</td>
                  <td className="py-2 px-3 text-green-600 font-semibold">Active</td>
                </tr>
                <tr className="border-t">
                  <td className="py-2 px-3">S-1000</td>
                  <td className="py-2 px-3">Le</td>
                  <td className="py-2 px-3">Station B</td>
                  <td className="py-2 px-3">09:20</td>
                  <td className="py-2 px-3 text-gray-500 font-medium">Finished</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
