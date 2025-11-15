// pages/admin/Settings.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import apiClient from "@/api/apiClient";

export default function Settings() {
  // 🔹 Cấu hình hệ thống lấy từ backend
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    maintenance_message: "",
    default_timezone: "Asia/Ho_Chi_Minh",
    currency: "VND",
    low_balance_threshold: 50000,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Lấy config từ API
  useEffect(() => {
    let isMounted = true;
    async function fetchSettings() {
      try {
        setLoading(true);
        setError("");
        const res = await apiClient({
          method: "GET",
          url: "/api/v1/system/settings",
        });
        if (!isMounted) return;
        if (res.data) {
          setSettings((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error("Settings fetch error:", err);
        if (!isMounted) return;
        setError("Không tải được cấu hình hệ thống.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lưu config về API
  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await apiClient({
        method: "PUT",
        url: "/api/v1/system/settings",
        data: settings,
      });

      setMessage("Đã lưu cấu hình hệ thống thành công.");
    } catch (err) {
      console.error("Settings save error:", err);
      setError("Lưu cấu hình thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        subtitle="Quản lý cấu hình chung cho toàn bộ hệ thống EV Charging"
      />

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg text-sm">
          {message}
        </div>
      )}

      <Section title="Chế độ bảo trì">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="rounded"
              checked={settings.maintenance_mode}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  maintenance_mode: e.target.checked,
                }))
              }
            />
            Bật chế độ bảo trì toàn hệ thống
          </label>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">
              Thông báo hiển thị cho người dùng
            </label>
            <textarea
              className="border rounded-lg px-3 py-2 text-sm min-h-[80px]"
              value={settings.maintenance_message}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  maintenance_message: e.target.value,
                }))
              }
              placeholder="Ví dụ: Hệ thống đang bảo trì từ 00:00 đến 03:00, vui lòng quay lại sau."
            />
          </div>
        </div>
      </Section>

      <Section title="Cấu hình chung">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Múi giờ */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Múi giờ mặc định</label>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 text-sm"
              value={settings.default_timezone}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  default_timezone: e.target.value,
                }))
              }
            />
            <p className="text-xs text-gray-500">
              Ví dụ: Asia/Ho_Chi_Minh, UTC, Asia/Tokyo,...
            </p>
          </div>

          {/* Tiền tệ */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Tiền tệ</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm"
              value={settings.currency}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  currency: e.target.value,
                }))
              }
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          {/* Ngưỡng cảnh báo ví */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">
              Ngưỡng cảnh báo số dư ví (VND)
            </label>
            <input
              type="number"
              className="border rounded-lg px-3 py-2 text-sm"
              value={settings.low_balance_threshold}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  low_balance_threshold: Number(e.target.value),
                }))
              }
            />
            <p className="text-xs text-gray-500">
              Khi số dư ví nhỏ hơn giá trị này, hệ thống sẽ gửi thông báo cho
              người dùng.
            </p>
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg"
        >
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>
    </div>
  );
}
