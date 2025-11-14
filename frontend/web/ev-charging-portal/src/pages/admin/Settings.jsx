// pages/admin/Settings.jsx
import React from "react";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/Section";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

/**
 * Trang Cài đặt hệ thống:
 * - Dùng ThemeProvider để đổi giao diện Sáng/Tối
 * - Dùng AuthProvider để cho phép admin đăng xuất toàn hệ thống
 * - Có thể mở rộng để gọi API cấu hình hệ thống sau này
 */
export default function AdminSettings() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth() || {};

  const handleLogoutAll = async () => {
    // Tuỳ backend: có thể truyền flag "all_devices: true"
    await logout({ all_devices: true }).catch(() => {});
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        subtitle="Quản lý giao diện, bảo mật và cấu hình chung"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Giao diện */}
        <Section title="Giao diện">
          <div className="space-y-4 text-sm">
            <div className="font-semibold text-gray-800">
              Chế độ hiển thị hiện tại
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </span>
              <button
                onClick={toggleTheme}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Chuyển chế độ
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Theme được lưu trong <code>localStorage("theme")</code> thông qua
              ThemeProvider.
            </p>
          </div>
        </Section>

        {/* Bảo mật & phiên */}
        <Section title="Bảo mật & Phiên đăng nhập">
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-semibold text-gray-800 mb-1">
                Tài khoản đang đăng nhập
              </div>
              <div className="text-gray-700">
                {user?.email || "Không xác định"}{" "}
                {user?.role ? (
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {user.role}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="font-semibold text-gray-800 mb-1">
                Đăng xuất toàn bộ thiết bị
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Hữu ích khi nghi ngờ tài khoản bị lộ hoặc sử dụng trên nhiều
                máy.
              </p>
              <button
                onClick={handleLogoutAll}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Đăng xuất tất cả thiết bị
              </button>
            </div>
          </div>
        </Section>

        {/* Thông tin phiên bản (tĩnh – có thể lấy từ API config sau) */}
        <Section title="Thông tin phiên bản">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Phiên bản frontend</span>
              <span className="font-semibold">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gateway API</span>
              <span className="font-semibold">
                {import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Build</span>
              <span className="font-semibold">#2025.11.14</span>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Có thể thay phần này bằng dữ liệu từ một endpoint cấu hình
              (config-service) nếu backend cung cấp.
            </p>
          </div>
        </Section>

        {/* Placeholder cho cấu hình nâng cao */}
        <Section title="Cấu hình nâng cao">
          <p className="text-sm text-gray-600">
            Khu vực này dành cho các cấu hình nâng cao (rate limit, threshold
            cảnh báo, cấu hình analytics...). Bạn có thể:
          </p>
          <ul className="mt-2 list-disc pl-5 text-xs text-gray-500 space-y-1">
            <li>
              Tạo một service mới (vd: <code>settingsService</code>) và gọi
              từ đây.
            </li>
            <li>
              Lưu giá trị vào backend thay vì <code>localStorage</code>.
            </li>
            <li>
              Sử dụng form + validation (React Hook Form) nếu cần phức tạp.
            </li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
