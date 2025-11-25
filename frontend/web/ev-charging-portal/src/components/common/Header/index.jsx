import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";
import Logo from "@/assets/images/logo.png";

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

  // Logout
  const handleLogout = async () => {
    if (!window.confirm("Bạn có chắc muốn đăng xuất?")) return;

    setIsLoggingOut(true);
    setShowProfile(false);

    try {
      if (apiLogout) {
        await apiLogout();
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.clear();

    if (setUser) setUser(null);

    navigate(ROUTERS.PUBLIC.LOGIN, { replace: true });
  };

  // Tạo viết tắt tên
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header className="h-[68px] sticky top-0 z-40 flex items-center justify-between px-6 bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.04)]">

      {/* LEFT: Logo + Tên */}
      <div className="flex items-center gap-3 select-none cursor-pointer">
        <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-white transition-transform duration-300 hover:scale-105">
          <img
            src={Logo}
            alt="Logo"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <div className="font-bold text-[18px] tracking-wide text-[#0f172a] drop-shadow-sm">
          EV Charging
        </div>
      </div>

      {/* RIGHT: Avatar */}
      <div className="relative" ref={popupRef}>
        <button
          onClick={toggleProfile}
          disabled={isLoggingOut}
          className="
            w-11 h-11 rounded-full 
            bg-gradient-to-br from-[#1e293b] to-[#0f172a] 
            flex items-center justify-center
            text-white font-bold text-[15px]
            shadow-lg hover:shadow-xl transition-all duration-300 
            hover:rotate-3 active:scale-95
          "
          title="Profile"
        >
          {initials}
        </button>

        {/* POPUP */}
        {showProfile && user && (
          <div
            className="
              absolute right-0 mt-4 w-72 bg-white rounded-xl 
              shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-gray-100 p-5 
              animate-[fadeIn_0.2s_ease-out] origin-top-right
            "
          >
            <div className="flex flex-col items-center text-center">
              
              {/* Avatar lớn */}
              <div
                className="
                  w-20 h-20 rounded-full 
                  bg-gradient-to-br from-[#1f2937] to-[#111827] 
                  text-white text-2xl font-bold 
                  flex items-center justify-center 
                  shadow-md mb-3
                "
              >
                {initials}
              </div>

              <div className="font-semibold text-[17px] text-[#111827]">
                {user.full_name}
              </div>

              <div className="text-sm text-gray-500">{user.email}</div>

              <div className="w-full text-left text-sm text-gray-600 mt-3 space-y-1">
                <p><strong>Phone:</strong> {user.phone || "Chưa có"}</p>
                <p>
                  <strong>Birth Date:</strong>{" "}
                  {user.date_of_birth
                    ? new Date(user.date_of_birth).toLocaleDateString()
                    : "Chưa có"}
                </p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Status:</strong> {user.status}</p>
                <p>
                  <strong>Email Verified:</strong>{" "}
                  {user.email_verified ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(user.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2 mt-5 w-full">
                <button
                  className="
                    flex-1 px-4 py-2 rounded-lg 
                    bg-[#0f62fe] text-white text-sm font-medium 
                    hover:bg-[#0353c3] transition-all duration-150 
                    active:scale-95 shadow
                  "
                  onClick={() => alert("Mở trang chỉnh sửa profile")}
                >
                  ✏️ Chỉnh sửa
                </button>

                <button
                  className="
                    flex-1 px-4 py-2 rounded-lg 
                    bg-[#ef4444] text-white text-sm font-medium 
                    hover:bg-[#dc2626] transition-all duration-150 
                    active:scale-95 shadow disabled:opacity-50
                  "
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "⏳..." : "🚪 Thoát"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
