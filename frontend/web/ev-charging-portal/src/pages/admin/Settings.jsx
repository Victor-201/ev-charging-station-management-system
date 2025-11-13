import { useState, useEffect, useContext } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import * as AuthModule from "@/contexts/AuthContext";
import * as UserModule from "@/contexts/UserContext";
import * as ThemeModule from "@/contexts/ThemeContext";

export default function Settings() {
  const { alerts, getAlerts, getHealth } = useAnalytics();
  const AuthContext = AuthModule.AuthContext || AuthModule.default || null;
  const UserContext = UserModule.UserContext || UserModule.default || null;
  const ThemeContext = ThemeModule.ThemeContext || ThemeModule.default || null;

  const { user, getMe, logout } = useContext(AuthContext) || {};
  const { update } = useContext(UserContext) || {};
  const { theme, toggleTheme } = useContext(ThemeContext) || {};

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusColor, setStatusColor] = useState("bg-blue-600");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(
    JSON.parse(localStorage.getItem("evcs_auto_refresh") || "true")
  );
  const [savedInfo, setSavedInfo] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [systemStatus, setSystemStatus] = useState("unknown");

  // 🔹 Refresh health/alerts on mount
  useEffect(() => {
    refreshSystem();
  }, []);

  const refreshSystem = async () => {
    try {
      const [h, a] = await Promise.all([getHealth(), getAlerts()]);
      const ok = Array.isArray(h?.data) ? h.data.every((x) => x?.status !== "error") : true;
      setSystemStatus(ok ? "healthy" : "degraded");
    } catch {
      setSystemStatus("unknown");
    }
  };

  // 🔹 Load dữ liệu
  useEffect(() => {
    const storedProfile = localStorage.getItem("admin_profile");
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      setProfile(parsed);
      setSavedInfo(parsed);
    } else if (getMe) {
      fetchUser();
    }
  }, []);

  // 🔹 Lấy dữ liệu người dùng
  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await getMe?.();
      setProfile({
        username: data?.username || "",
        email: data?.email || "",
        password: "",
        role: data?.role || "admin",
      });
    } catch {
      showStatus("⚠️ Không thể tải thông tin!", "bg-red-600");
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Validate email
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 🔔 Hiển thị toast
  const showStatus = (msg, color = "bg-blue-600") => {
    setStatusMsg(msg);
    setStatusColor(color);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  // 💾 Lưu thông tin chính
  const handleSaveProfile = async () => {
    if (!profile.username || !profile.email || !profile.role) {
      showStatus("⚠️ Vui lòng nhập đầy đủ thông tin!", "bg-yellow-600");
      return;
    }
    if (!isValidEmail(profile.email)) {
      showStatus("❌ Email không hợp lệ!", "bg-red-600");
      return;
    }

    setSaving(true);
    try {
      if (update && user?.id) {
        await update(user.id, profile);
        showStatus("✅ Đã lưu thay đổi!", "bg-green-600");
      } else {
        localStorage.setItem("admin_profile", JSON.stringify(profile));
        showStatus("💾 Đã lưu tạm vào trình duyệt!", "bg-green-600");
      }
      setSavedInfo(profile);
    } catch {
      showStatus("❌ Lỗi khi lưu thông tin!", "bg-red-600");
    } finally {
      setSaving(false);
    }
  };

  // ✏️ Chỉnh sửa
  const handleEditProfile = () => {
    if (!savedInfo) return;
    setEditForm(savedInfo);
    showStatus("✏️ Đang chỉnh sửa...", "bg-yellow-600");
  };

  // 💾 Lưu chỉnh sửa
  const handleSaveEdit = () => {
    if (!editForm.username || !editForm.email || !editForm.role) {
      showStatus("⚠️ Nhập đủ thông tin trước khi lưu!", "bg-yellow-600");
      return;
    }
    if (!isValidEmail(editForm.email)) {
      showStatus("❌ Email không hợp lệ!", "bg-red-600");
      return;
    }

    localStorage.setItem("admin_profile", JSON.stringify(editForm));
    setSavedInfo(editForm);
    setProfile(editForm);
    setEditForm(null);
    showStatus("✅ Cập nhật thành công!", "bg-green-600");
  };

  // 🗑️ Xóa
  const handleDeleteProfile = () => {
    localStorage.removeItem("admin_profile");
    setSavedInfo(null);
    setProfile({ username: "", email: "", password: "", role: "" });
    setEditForm(null);
    showStatus("🗑️ Đã xóa thông tin!", "bg-red-600");
  };

  // 🚪 Đăng xuất
  const handleLogout = async () => {
    try {
      await logout?.();
      showStatus("👋 Đã đăng xuất!", "bg-blue-600");
      setTimeout(() => (window.location.href = "/admin/login"), 1000);
    } catch {
      showStatus("⚠️ Lỗi khi đăng xuất!", "bg-red-600");
    }
  };

  // 💾 Lưu thông báo
  const saveNotifications = () => {
    localStorage.setItem("emailNotif", JSON.stringify(emailNotif));
    localStorage.setItem("smsNotif", JSON.stringify(smsNotif));
    showStatus("✅ Đã lưu cài đặt thông báo!", "bg-green-600");
  };

  // 🔄 Auto refresh
  const toggleAutoRefresh = () => {
    const newVal = !autoRefresh;
    setAutoRefresh(newVal);
    localStorage.setItem("evcs_auto_refresh", JSON.stringify(newVal));
  };

  return (
    <div className="space-y-6 relative">
      {statusMsg && (
        <div
          className={`${statusColor} fixed top-5 right-5 text-white px-4 py-2 rounded shadow-md z-50 animate-fadeIn`}
        >
          {statusMsg}
        </div>
      )}

      <PageHeader
        title="Cài đặt hệ thống"
        subtitle="Cấu hình tài khoản quản trị, chủ đề giao diện và thông báo"
      />

      {/* === Thông tin quản trị viên === */}
      <Section title="Thông tin quản trị viên">
        {loading ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : (
          <div className="max-w-xl space-y-3">
            {/* Form nhập */}
            <label className="block">
              <span className="text-sm text-gray-600">Tên người dùng *</span>
              <input
                type="text"
                value={profile.username}
                onChange={(e) =>
                  setProfile({ ...profile, username: e.target.value })
                }
                className="w-full border rounded px-3 py-1.5 mt-1"
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Email *</span>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className="w-full border rounded px-3 py-1.5 mt-1"
                placeholder="example@gmail.com"
              />
            </label>

            <label className="block relative">
              <span className="text-sm text-gray-600">Mật khẩu</span>
              <input
                type={showPassword ? "text" : "password"}
                value={profile.password}
                onChange={(e) =>
                  setProfile({ ...profile, password: e.target.value })
                }
                className="w-full border rounded px-3 py-1.5 mt-1 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Vai trò *</span>
              <select
                value={profile.role}
                onChange={(e) =>
                  setProfile({ ...profile, role: e.target.value })
                }
                className="w-full border rounded px-3 py-1.5 mt-1"
              >
                <option value="">-- Chọn vai trò --</option>
                <option value="admin">Quản trị viên</option>
                <option value="manager">Quản lý trạm</option>
                <option value="staff">Nhân viên vận hành</option>
              </select>
            </label>

            <div className="flex gap-3 mt-3">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                💾 Lưu thay đổi
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-1.5 rounded hover:bg-red-700"
              >
                🚪 Đăng xuất
              </button>
            </div>

            {/* === Bảng hiển thị === */}
            {savedInfo && (
              <div className="mt-5 border rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full text-sm border-collapse text-left">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-2">Tên người dùng</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Vai trò</th>
                      <th className="px-4 py-2 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="px-4 py-2 border-t">{savedInfo.username}</td>
                      <td className="px-4 py-2 border-t">{savedInfo.email}</td>
                      <td className="px-4 py-2 border-t capitalize">
                        {savedInfo.role === "admin"
                          ? "Quản trị viên"
                          : savedInfo.role === "manager"
                          ? "Quản lý trạm"
                          : "Nhân viên vận hành"}
                      </td>
                      <td className="px-4 py-2 border-t text-center space-x-2">
                        <button
                          onClick={handleEditProfile}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          ✏️ Chỉnh sửa
                        </button>
                        <button
                          onClick={handleDeleteProfile}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* === Form chỉnh sửa xuất hiện bên dưới bảng === */}
            {editForm && (
              <div className="mt-5 p-4 border rounded-lg bg-gray-50 shadow-sm animate-fadeIn">
                <h3 className="font-semibold mb-2 text-blue-600">
                  ✏️ Chỉnh sửa thông tin
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    placeholder="Tên người dùng"
                    className="w-full border rounded px-3 py-1.5"
                  />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    placeholder="Email"
                    className="w-full border rounded px-3 py-1.5"
                  />
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                    placeholder="Mật khẩu"
                    className="w-full border rounded px-3 py-1.5"
                  />
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                    className="w-full border rounded px-3 py-1.5"
                  >
                    <option value="admin">Quản trị viên</option>
                    <option value="manager">Quản lý trạm</option>
                    <option value="staff">Nhân viên vận hành</option>
                  </select>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700"
                    >
                      💾 Lưu chỉnh sửa
                    </button>
                    <button
                      onClick={() => setEditForm(null)}
                      className="bg-gray-400 text-white px-4 py-1.5 rounded hover:bg-gray-500"
                    >
                      ✖ Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* === Hệ thống & Theme === */}
      <Section title="Hệ thống & Theme">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={toggleTheme}
            className="rounded bg-gray-700 text-white px-4 py-2 hover:bg-gray-800"
          >
            🌓 Đổi theme ({theme === "dark" ? "Tối" : "Sáng"})
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
            />
            <span>Tự động tải lại dữ liệu mỗi 60s</span>
          </label>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span>
              Trạng thái hệ thống:
              <b className={
                systemStatus === "healthy"
                  ? "text-emerald-600 ml-1"
                  : systemStatus === "degraded"
                  ? "text-amber-600 ml-1"
                  : "text-gray-500 ml-1"
              }>
                {systemStatus}
              </b>
            </span>
            <span>•</span>
            <span>Cảnh báo mở: <b>{Array.isArray(alerts) ? alerts.length : 0}</b></span>
            <button onClick={refreshSystem} className="px-3 py-1 rounded bg-blue-600 text-white">
              Làm mới
            </button>
          </div>
        </div>
      </Section>

      {/* === Thông báo === */}
      <Section title="Thông báo hệ thống">
        <div className="max-w-xl space-y-4">
          <label className="flex items-center justify-between border p-3 rounded">
            <span>Email</span>
            <input
              type="checkbox"
              checked={emailNotif}
              onChange={(e) => setEmailNotif(e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between border p-3 rounded">
            <span>SMS</span>
            <input
              type="checkbox"
              checked={smsNotif}
              onChange={(e) => setSmsNotif(e.target.checked)}
            />
          </label>
          <button
            onClick={saveNotifications}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            💾 Lưu cài đặt
          </button>
        </div>
      </Section>
    </div>
  );
}
