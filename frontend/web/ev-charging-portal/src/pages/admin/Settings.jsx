import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import apiClient from "@/api/apiClient";

/**
 * Admin – System Settings
 * Lưu toàn bộ cấu hình hệ thống xuống DB.
 * API backend:
 *   GET  /api/v1/system/settings
 *   PUT  /api/v1/system/settings
 */
export default function Settings() {
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    alert_email: "",
    log_retention_days: 30,
    auto_reconcile: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // =========================================
  // LOAD SETTINGS TỪ BACKEND
  // =========================================
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get("/api/v1/system/settings");
        const data = res?.data || {};

        setSettings((prev) => ({
          ...prev,
          ...data,
        }));
      } catch (err) {
        console.error("[Settings] load error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải cấu hình hệ thống."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // =========================================
  // HANDLE CHANGE FIELD
  // =========================================
  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // =========================================
  // SAVE SETTINGS
  // =========================================
  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiClient.put("/api/v1/system/settings", settings);
      setMessage("Đã lưu cấu hình xuống database.");
    } catch (err) {
      console.error("[Settings] save error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể lưu cấu hình hệ thống."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // RENDER UI
  // =========================================
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="System Settings"
          subtitle="Các cài đặt này được lưu trực tiếp xuống DB, backend sẽ đọc và áp dụng."
        />

        {loading && (
          <div className="text-sm text-slate-500">
            Đang tải cấu hình từ API...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        <Section title="Cấu hình hệ thống">
          <div className="bg-white rounded-xl border shadow-sm p-4 space-y-6 text-sm">
            {/* Maintenance Mode */}
            <label className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Maintenance Mode</div>
                <div className="text-xs text-slate-500">
                  Khi bật, chỉ admin được vào hệ thống.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) =>
                  updateField("maintenance_mode", e.target.checked)
                }
                className="w-5 h-5"
              />
            </label>

            {/* Alert Email */}
            <label className="block">
              <div className="font-semibold mb-1">Alert Email</div>
              <input
                type="email"
                value={settings.alert_email}
                onChange={(e) => updateField("alert_email", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="ops@example.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                Email dùng để nhận alert từ hệ thống monitoring.
              </p>
            </label>

            {/* Log Retention */}
            <label className="block">
              <div className="font-semibold mb-1">Thời gian giữ log (ngày)</div>
              <input
                type="number"
                min={1}
                value={settings.log_retention_days}
                onChange={(e) =>
                  updateField(
                    "log_retention_days",
                    Number(e.target.value) || 1
                  )
                }
                className="w-32 border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                Backend sẽ tự động xoá log cũ theo số ngày này.
              </p>
            </label>

            {/* Auto Reconcile */}
            <label className="flex items-center justify-between pt-2 border-t">
              <div>
                <div className="font-semibold">
                  Tự động reconcile phiên đặt trước
                </div>
                <div className="text-xs text-slate-500">
                  Backend sẽ cân đối tiền đặt trước & tiền thực tế khi phiên
                  sạc kết thúc.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_reconcile}
                onChange={(e) =>
                  updateField("auto_reconcile", e.target.checked)
                }
                className="w-5 h-5"
              />
            </label>

            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
