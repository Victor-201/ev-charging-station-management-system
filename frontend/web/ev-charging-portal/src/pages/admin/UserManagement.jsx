// ✅ UserManagement.jsx
// Full CRUD + Deactivate + Vehicles (mock local) + thống kê staff/admin
import { useEffect, useMemo, useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";

import userService from "@/services/userService";

const OVERLAY_USERS_KEY = "evcs_overlay_users";
const OVERLAY_VEHICLES_KEY = "evcs_overlay_user_vehicles";
const getOverlayUsers = () => JSON.parse(localStorage.getItem(OVERLAY_USERS_KEY) || "[]");
const setOverlayUsers = (arr) => localStorage.setItem(OVERLAY_USERS_KEY, JSON.stringify(arr));
const getOverlayVehicles = () => JSON.parse(localStorage.getItem(OVERLAY_VEHICLES_KEY) || "{}");
const setOverlayVehicles = (obj) => localStorage.setItem(OVERLAY_VEHICLES_KEY, JSON.stringify(obj));

// ======================= MAIN COMPONENT =======================
export default function UserManagement() {
  const { getUserMonthlyReport, userMonthlyReport } = useAnalytics();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create" });
  const [form, setForm] = useState({ id: null, username: "", password: "", role: "staff" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleForm, setVehicleForm] = useState({ plate: "", model: "" });
  const [stats, setStats] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);

  const roles = useMemo(
    () => [
      { value: "admin", label: "Admin" },
      { value: "staff", label: "Staff" },
    ],
    []
  );

  // Load all users
  const loadUsers = async () => {
    setLoading(true);
    try {
      // Expect API to provide list of users
      const res = await userService.getProfile();
      const me = res?.data ?? null;
      const overlay = getOverlayUsers();
      const base = me ? [me] : [];
      const merged = [...base];
      overlay.forEach((u) => {
        if (!merged.some((b) => String(b.username).toLowerCase() === String(u.username).toLowerCase())) {
          merged.push(u);
        }
      });
      setUsers(merged);
      const adminCount = merged.filter((u) => u.role === "admin").length;
      const staffCount = merged.filter((u) => u.role === "staff").length;
      setStats({ total: merged.length, admin: adminCount, staff: staffCount });
      try {
        if (me?.id) {
          const rep = await getUserMonthlyReport(me.id);
          setMonthlyReport(rep?.data ?? userMonthlyReport ?? null);
        }
      } catch {/* ignore */}
    } catch {
      const overlay = getOverlayUsers();
      setUsers(overlay);
      const adminCount = overlay.filter((u) => u.role === "admin").length;
      const staffCount = overlay.filter((u) => u.role === "staff").length;
      setStats({ total: overlay.length, admin: adminCount, staff: staffCount });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 2500);
  };

  const recomputeStats = (list) => {
    const adminCount = list.filter((u) => u.role === "admin").length;
    const staffCount = list.filter((u) => u.role === "staff").length;
    setStats({ total: list.length, admin: adminCount, staff: staffCount });
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setError("");

    const username = form.username.trim();
    if (!username) {
      setError("Vui lòng nhập tài khoản!");
      return;
    }

    let updatedUsers = users.slice();
    if (modal.mode === "create") {
      const exists = users.some((u) => String(u.username).toLowerCase() === username.toLowerCase());
      if (exists) {
        setError("Tài khoản đã tồn tại!");
        return;
      }
      const newUser = {
        id: Date.now(),
        username,
        role: form.role,
        active: true,
      };
      const overlay = getOverlayUsers();
      setOverlayUsers([...overlay, newUser]);
      updatedUsers = [...updatedUsers, newUser];
      setUsers(updatedUsers);
      showToast("✅ Đã tạo người dùng");
    } else if (modal.mode === "edit") {
      const overlay = getOverlayUsers();
      const updated = overlay.map((x) => (x.id === form.id ? { ...x, role: form.role } : x));
      setOverlayUsers(updated);
      updatedUsers = updatedUsers.map((x) => (x.id === form.id ? { ...x, role: form.role } : x));
      setUsers((prev) => prev.map((x) => (x.id === form.id ? { ...x, role: form.role } : x)));
      showToast("✏️ Đã cập nhật người dùng");
    }

    setModal({ open: false, mode: "create" });
    setForm({ id: null, username: "", password: "", role: "staff" });
    recomputeStats(getOverlayUsers());
  };

  const handleDeactivate = async (user) => {
    const nextActive = !user.active;
    const overlay = getOverlayUsers();
    const exists = overlay.some((x) => x.id === user.id);
    const updated = exists
      ? overlay.map((x) => (x.id === user.id ? { ...x, active: nextActive } : x))
      : [...overlay, { ...user, active: nextActive }];
    setOverlayUsers(updated);
    setUsers((prev) => prev.map((x) => (x.id === user.id ? { ...x, active: nextActive } : x)));
    recomputeStats(updated);
    showToast(nextActive ? "✅ Đã kích hoạt" : "🚫 Đã hủy kích hoạt");
  };

  const handleDelete = async (user) => {
    const overlay = getOverlayUsers();
    const updated = overlay.filter((x) => x.id !== user.id);
    setOverlayUsers(updated);
    setUsers(updated);
    recomputeStats(updated);
    showToast("🗑️ Đã xóa người dùng");
  };

  const openVehicles = async (user) => {
    const overlay = getOverlayVehicles();
    setSelectedUser(user);
    setVehicles(overlay[user.id] || []);
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.plate.trim()) return;
    const overlay = getOverlayVehicles();
    const list = overlay[selectedUser.id] || [];
    const updatedList = [...list, { plate: vehicleForm.plate, model: vehicleForm.model }];
    overlay[selectedUser.id] = updatedList;
    setOverlayVehicles(overlay);
    setVehicles(updatedList);
    setVehicleForm({ plate: "", model: "" });
  };

  const handleDeleteVehicle = async (plate) => {
    const overlay = getOverlayVehicles();
    const list = overlay[selectedUser.id] || [];
    const updatedList = list.filter((v) => v.plate !== plate);
    overlay[selectedUser.id] = updatedList;
    setOverlayVehicles(overlay);
    setVehicles(updatedList);
  };

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded shadow z-50">
          {statusMsg}
        </div>
      )}
      <PageHeader title="Quản lý người dùng" subtitle="Quản lý tài khoản, vai trò và phương tiện" />

      <Section
        title="Danh sách người dùng"
        actions={
          <button
            onClick={() => {
              setForm({ id: null, username: "", password: "", role: "staff" });
              setModal({ open: true, mode: "create" });
            }}
            className="rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-white"
          >
            + Tạo người dùng
          </button>
        }
      >
        {loading ? (
          <p className="text-gray-500">⏳ Đang tải dữ liệu...</p>
        ) : (
          <>
            {stats && (
              <p className="text-sm text-gray-600 mb-2">
                👥 Tổng cộng: {stats.total} (Admin: {stats.admin}, Staff: {stats.staff})
              </p>
            )}
            {monthlyReport && (
              <p className="text-xs text-indigo-600 mb-2">
                📈 Báo cáo tháng (user đầu tiên admin): {JSON.stringify(monthlyReport).slice(0,120)}...
              </p>
            )}
            <Table
              columns={[
                { key: "username", title: "Tài khoản", dataIndex: "username" },
                { key: "role", title: "Vai trò", dataIndex: "role" },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: (_, row) =>
                    row.active ? (
                      <span className="text-green-600 font-medium">Hoạt động</span>
                    ) : (
                      <span className="text-red-500 font-medium">Đã hủy kích hoạt</span>
                    ),
                },
                {
                  key: "actions",
                  title: "Hành động",
                  render: (_, row) => (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm"
                        onClick={() => {
                          setForm({ id: row.id, username: row.username, role: row.role });
                          setModal({ open: true, mode: "edit" });
                        }}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-sm"
                        onClick={() => openVehicles(row)}
                      >
                        🚗 Xe
                      </button>
                      <button
                        type="button"
                        className={row.active ? "bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-sm" : "bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"}
                        onClick={() => handleDeactivate(row)}
                      >
                        {row.active ? "🚫 Hủy kích hoạt" : "✅ Kích hoạt"}
                      </button>
                      <button
                        type="button"
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                        onClick={() => handleDelete(row)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  ),
                },
              ]}
              data={users}
            />
          </>
        )}
      </Section>

      {/* Modal thêm / sửa */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3">
              {modal.mode === "edit" ? "Chỉnh sửa người dùng" : "Tạo người dùng mới"}
            </h2>
            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="text-sm">Tài khoản</label>
                <input
                  className="w-full border p-2 rounded mt-1"
                  disabled={modal.mode === "edit"}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>
              {modal.mode === "create" && (
                <div>
                  <label className="text-sm">Mật khẩu</label>
                  <input
                    type="password"
                    className="w-full border p-2 rounded mt-1"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
              )}
              <div>
                <label className="text-sm">Vai trò</label>
                <select
                  className="w-full border p-2 rounded mt-1"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="border border-gray-300 px-3 py-1.5 rounded"
                  onClick={() => setModal({ open: false, mode: "create" })}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded"
                >
                  {modal.mode === "edit" ? "Cập nhật" : "Tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal quản lý xe */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-3">
              🚗 Phương tiện của {selectedUser.username}
            </h2>
            <form onSubmit={handleAddVehicle} className="flex gap-2 mb-3">
              <input
                placeholder="Biển số xe"
                className="border p-2 rounded flex-1"
                value={vehicleForm.plate}
                onChange={(e) =>
                  setVehicleForm((f) => ({ ...f, plate: e.target.value }))
                }
              />
              <input
                placeholder="Mẫu xe"
                className="border p-2 rounded flex-1"
                value={vehicleForm.model}
                onChange={(e) =>
                  setVehicleForm((f) => ({ ...f, model: e.target.value }))
                }
              />
              <button className="bg-green-600 text-white px-3 rounded">Thêm</button>
            </form>
            {vehicles.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có phương tiện nào.</p>
            ) : (
              <ul className="space-y-2">
                {vehicles.map((v) => (
                  <li
                    key={v.plate}
                    className="border rounded p-2 flex justify-between items-center"
                  >
                    <span>
                      <b>{v.plate}</b> – {v.model}
                    </span>
                    <button
                      className="text-red-600 text-sm"
                      onClick={() => handleDeleteVehicle(v.plate)}
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end mt-4">
              <button
                className="border border-gray-300 px-3 py-1.5 rounded"
                onClick={() => setSelectedUser(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
