import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";

export default function Navbar({ onToggle }) {
  const { user, setUser } = useUser();
  const { logout: apiLogout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const popupRef = useRef(null);

  const toggleProfile = () => setShowProfile((prev) => !prev);

  // Ẩn popup khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout function - ĐÃ CẢI TIẾN
  const handleLogout = async () => {
    if (!window.confirm("Bạn có chắc muốn đăng xuất?")) return;

    setIsLoggingOut(true);
    setShowProfile(false);

    try {
      // Gọi API logout (nếu có)
      if (apiLogout) {
        await apiLogout();
      }
    } catch (err) {
      console.error("Logout API failed:", err);
      // Vẫn tiếp tục logout ở client dù API fail
    }

    // Clear tất cả data ở client
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken"); // nếu có
    localStorage.removeItem("user"); // nếu có lưu user
    sessionStorage.clear(); // clear luôn sessionStorage

    // Clear user state
    if (setUser) {
      setUser(null);
    }

    // Cách 1: Dùng navigate (SPA navigation)
    navigate(ROUTERS.PUBLIC.LOGIN, { replace: true });

    // Cách 2: Nếu navigate không work, dùng window.location (uncomment nếu cần)
    // window.location.href = ROUTERS.PUBLIC.LOGIN;

    // Cách 3: Force reload hoàn toàn (uncomment nếu cần)
    // window.location.replace(ROUTERS.PUBLIC.LOGIN);
  };

  // Tạo chữ cái viết tắt
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header className="h-[68px] sticky top-0 z-40 flex items-center justify-between px-5 bg-gradient-to-b from-white to-[#f7fbff] border-b border-[rgba(8,12,20,0.04)]">
      {/* Left */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="bg-[rgba(15,98,254,0.06)] h-11 w-11 grid place-items-center rounded-xl transition-transform duration-100 active:scale-95 hover:bg-[rgba(15,98,254,0.1)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 grid place-items-center rounded-xl bg-gradient-to-b from-[#0f62fe] to-[#0353c3] text-white font-bold shadow-[0_6px_18px_rgba(15,98,254,0.12)]">
            ⚡
          </div>
          <div className="font-bold text-[15px] text-[#07122a]">EV Charging</div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 relative">
        <div className="min-w-[260px] max-[900px]:hidden">
          <input
            className="w-full p-2.5 rounded-xl border border-[rgba(8,12,20,0.06)] shadow-[0_6px_18px_rgba(10,12,20,0.03)] outline-none text-[14px]"
            placeholder="Tìm kiếm trạm, phiên..."
            aria-label="Search"
          />
        </div>

        <button
          className="bg-transparent border-none h-10 w-10 rounded-xl cursor-pointer font-bold text-lg"
          title="Help"
        >
          ?
        </button>

        {/* Profile Button */}
        <div className="relative" ref={popupRef}>
          <button
            onClick={toggleProfile}
            className="w-10 h-10 grid place-items-center rounded-xl font-bold bg-gradient-to-b from-[#111827] to-[#1f2937] text-white"
            title="Profile"
            disabled={isLoggingOut}
          >
            {initials}
          </button>

          {/* Profile Popup */}
          {showProfile && user && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-[rgba(0,0,0,0.05)] p-5 animate-fadeIn">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#111827] to-[#1f2937] text-white font-bold grid place-items-center text-2xl mb-3 shadow-md">
                  {initials}
                </div>
                <div className="font-semibold text-[17px] text-[#111827]">
                  {user.full_name}
                </div>
                <div className="text-[14px] text-[#6b7280] mt-1">{user.email}</div>

                <div className="text-[14px] text-[#6b7280] mt-1 w-full text-left">
                  <p><strong>Phone:</strong> {user.phone || "Chưa có"}</p>
                  <p>
                    <strong>Birth Date:</strong>{" "}
                    {user.date_of_birth
                      ? new Date(user.date_of_birth).toLocaleDateString()
                      : "Chưa có"}
                  </p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>Status:</strong> {user.status}</p>
                  <p><strong>Email Verified:</strong> {user.email_verified ? "Yes" : "No"}</p>
                  <p>
                    <strong>Created At:</strong>{" "}
                    {new Date(user.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2 mt-5 w-full">
                  <button
                    className="flex-1 px-4 py-2 text-sm font-medium bg-[#0f62fe] text-white rounded-xl hover:bg-[#0353c3] transition-all duration-150 active:scale-95"
                    onClick={() => alert("Mở trang chỉnh sửa profile")}
                  >
                    ✏️ Chỉnh sửa
                  </button>
                  <button
                    className="flex-1 px-4 py-2 text-sm font-medium bg-[#ef4444] text-white rounded-xl hover:bg-[#dc2626] transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "⏳ Đang xuất..." : "🚪 Đăng xuất"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}