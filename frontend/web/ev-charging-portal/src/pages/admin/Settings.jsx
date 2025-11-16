import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import apiClient from "@/api/apiClient";

/**
 * System Settings cho admin
 * - Lưu cấu hình global xuống DB (maintenance, alert_email, retention logs, auto reconcile...)
 */
export default function AdminSettings() {
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    alert_email: "",
    log_retention_days: 30,
    auto_reconcile: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load settings từ backend
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get("/api/v1/system/settings");
        setSettings((prev) => ({ ...prev, ...(res.data || {}) }));
      } catch (err) {
        console.error("[AdminSettings] load error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải cấu hình hệ thống."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const onChangeField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await apiClient.put("/api/v1/system/settings", settings);
      setMessage("Đã lưu cấu hình hệ thống vào database.");
    } catch (err) {
      console.error("[AdminSettings] save error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể lưu cấu hình."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="System Settings"
          subtitle="Tất cả cài đặt ở đây đều được lưu xuống database, backend đọc và áp dụng."
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

        <Section title="Chế độ hệ thống">
          <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4 text-sm">
            <label className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-slate-900">
                  Maintenance mode
                </div>
                <div className="text-xs text-slate-500">
                  Khi bật, chỉ admin mới truy cập được hệ thống (tuỳ backend xử
                  lý).
                </div>
              </div>
              <input
                type="checkbox"
                checked={!!settings.maintenance_mode}
                onChange={(e) =>
                  onChangeField("maintenance_mode", e.target.checked)
                }
                className="w-5 h-5"
              />
            </label>

            <label className="block">
              <div className="font-semibold text-slate-900 text-sm mb-1">
                Email nhận alert
              </div>
              <input
                type="email"
                value={settings.alert_email || ""}
                onChange={(e) => onChangeField("alert_email", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="ops@example.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                Dùng để gửi alert từ /api/v1/monitoring/alerts.
              </p>
            </label>

            <label className="block">
              <div className="font-semibold text-slate-900 text-sm mb-1">
                Thời gian giữ log (ngày)
              </div>
              <input
                type="number"
                min={1}
                value={settings.log_retention_days || 30}
                onChange={(e) =>
                  onChangeField(
                    "log_retention_days",
                    Number(e.target.value) || 1
                  )
                }
                className="w-32 border rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Backend sẽ dùng giá trị này để xoá log cũ.
              </p>
            </label>

            <label className="flex items-center justify-between gap-4 pt-2 border-t">
              <div>
                <div className="font-semibold text-slate-900">
                  Tự động reconcile phiên có đặt trước
                </div>
                <div className="text-xs text-slate-500">
                  Nếu bật, backend sẽ cân đối tiền đặt trước và tiền thực tế
                  ngay khi phiên kết thúc.
                </div>
              </div>
              <input
                type="checkbox"
                checked={!!settings.auto_reconcile}
                onChange={(e) =>
                  onChangeField("auto_reconcile", e.target.checked)
                }
                className="w-5 h-5"
              />
            </label>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
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
