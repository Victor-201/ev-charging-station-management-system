import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/staff/Card";
import { ROUTERS } from "@/utils/constants";

// ICONS trắng / đơn giản
import {
  CreditCard,
  Zap,
  Battery,
  Settings,
  Camera,
  ChevronRight,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const quickCards = [
    {
      key: "payments",
      title: "Payments",
      subtitle: "Xử lý & ghi nhận",
      icon: <CreditCard size={42} strokeWidth={1.5} className="text-blue-600" />,
      route: ROUTERS.STAFF.PAYMENTS,
    },
    {
      key: "stations",
      title: "Stations",
      subtitle: "Quản lý trạm sạc",
      icon: <Zap size={42} strokeWidth={1.5} className="text-green-600" />,
      route: ROUTERS.STAFF.STATIONS,
    },
    {
      key: "sessions",
      title: "Sessions",
      subtitle: "Phiên đang chạy",
      icon: <Battery size={42} strokeWidth={1.5} className="text-yellow-600" />,
      route: ROUTERS.STAFF.SESSIONS,
    },
    {
      key: "IncidentReport",
      title: "Incident Report",
      subtitle: "Báo cáo hệ thống",
      icon: <Settings size={42} strokeWidth={1.5} className="text-purple-600" />,
      route: ROUTERS.STAFF.INCIDENT_REPORT,
    },
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
          {/* ICON CAMERA */}
          <div className="w-[180px] h-[180px] rounded-xl border-2 border-dashed border-white/20 
                          bg-white/10 flex items-center justify-center">
            <Camera size={74} strokeWidth={1.4} className="text-white" />
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
              onClick={() => navigate(c.route)}
              aria-label={c.title}
              className="bg-white border border-gray-100 rounded-xl shadow-md flex items-center justify-between gap-4
                         px-5 py-5 min-h-[130px] transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <div
                  className={`w-[84px] h-[84px] flex items-center justify-center rounded-lg shadow-sm 
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

              {/* → */}
              <ChevronRight size={28} className="text-blue-600" />
            </button>
          ))}
        </div>

        {/* Latest Sessions */}
      
      </div>
    </div>
  );
}
