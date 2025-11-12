// ✅ UserManagement.jsx
// Full CRUD + Deactivate + Vehicles (mock local) + thống kê staff/admin
import { useEffect, useMemo, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";

// Local mock key
const LOCAL_KEY_USERS = "evcs_users_cache";
const LOCAL_KEY_VEHICLES = "evcs_user_vehicles";

// Mock fallback users
const fallbackUsers = [
  { id: 1, username: "alice", role: "admin", active: true },
  { id: 2, username: "bob", role: "staff", active: true },
  { id: 3, username: "charlie", role: "staff", active: true },
];

// 🚀 Mock userService (thay bằng API thật nếu backend có sẵn)
const userService = {
  getAll: async () => JSON.parse(localStorage.getItem(LOCAL_KEY_USERS) || "[]"),
  getById: async (id) => {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY_USERS) || "[]");
    return all.find((u) => u.id === id);
  },
  update: async (id, payload) => {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY_USERS) || "[]");
    const updated = all.map((u) => (u.id === id ? { ...u, ...payload } : u));
    localStorage.setItem(LOCAL_KEY_USERS, JSON.stringify(updated));
    return updated.find((u) => u.id === id);
  },
  deactivate: async (id) => {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY_USERS) || "[]");
    const updated = all.map((u) => (u.id === id ? { ...u, active: false } : u));
    localStorage.setItem(LOCAL_KEY_USERS, JSON.stringify(updated));
    return true;
  },
  erase: async (id) => {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY_USERS) || "[]");
    const updated = all.filter((u) => u.id !== id);
    localStorage.setItem(LOCAL_KEY_USERS, JSON.stringify(updated));
    return true;
  },
  getVehicles: async (userId) => {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY_VEHICLES) || "{}");
    return all[userId] || [];
  },
  addVehicle: async (userId, vehicle) => {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY_VEHICLES) || "{}");
    if (!all[userId]) all[userId] = [];
    all[userId].push(vehicle);
    localStorage.setItem(LOCAL_KEY_VEHICLES, JSON.stringify(all));
    return all[userId];
  },
  deleteVehicle: async (userId, plate) => {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY_VEHICLES) || "{}");
    if (!all[userId]) return [];
    all[userId] = all[userId].filter((v) => v.plate !== plate);
    localStorage.setItem(LOCAL_KEY_VEHICLES, JSON.stringify(all));
    return all[userId];
  },
  getAllStaff: async () => {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY_USERS) || "[]");
    return all.filter((u) => u.role === "staff");
  },
  getStaffStatistics: async () => {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY_USERS) || "[]");
    const adminCount = all.filter((u) => u.role === "admin").length;
    const staffCount = all.filter((u) => u.role === "staff").length;
    return { total: all.length, admin: adminCount, staff: staffCount };
  },
};

// ======================= MAIN COMPONENT =======================
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create" });
  const [form, setForm] = useState({ id: null, username: "", password: "", role: "staff" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleForm, setVehicleForm] = useState({ plate: "", model: "" });
  const [stats, setStats] = useState(null);

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
    const cached = await userService.getAll();
    if (!cached || cached.length === 0) {
      localStorage.setItem(LOCAL_KEY_USERS, JSON.stringify(fallbackUsers));
      setUsers(fallbackUsers);
    } else {
      setUsers(cached);
    }
    const stat = await userService.getStaffStatistics();
    setStats(stat);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setError("");

    const username = form.username.trim();
    if (!username) {
      setError("Vui lòng nhập tài khoản!");
      return;
    }

    if (modal.mode === "create") {
      const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
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
      const updated = [...users, newUser];
      localStorage.setItem(LOCAL_KEY_USERS, JSON.stringify(updated));
      setUsers(updated);
    } else if (modal.mode === "edit") {
      await userService.update(form.id, { role: form.role });
      const updated = await userService.getAll();
      setUsers(updated);
    }

    setModal({ open: false, mode: "create" });
    setForm({ id: null, username: "", password: "", role: "staff" });
    const stat = await userService.getStaffStatistics();
    setStats(stat);
  };

  const handleDeactivate = async (user) => {
    await userService.deactivate(user.id);
    const updated = await userService.getAll();
    setUsers(updated);
  };

  const handleDelete = async (user) => {
    if (!confirm(`Xóa tài khoản ${user.username}?`)) return;
    await userService.erase(user.id);
    const updated = await userService.getAll();
    setUsers(updated);
  };

  const openVehicles = async (user) => {
    const v = await userService.getVehicles(user.id);
    setSelectedUser(user);
    setVehicles(v);
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.plate.trim()) return;
    const newVehicle = { plate: vehicleForm.plate, model: vehicleForm.model };
    const updated = await userService.addVehicle(selectedUser.id, newVehicle);
    setVehicles(updated);
    setVehicleForm({ plate: "", model: "" });
  };

  const handleDeleteVehicle = async (plate) => {
    const updated = await userService.deleteVehicle(selectedUser.id, plate);
    setVehicles(updated);
  };

  return (
    <div className="space-y-6">
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
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm"
                        onClick={() => {
                          setForm({ id: row.id, username: row.username, role: row.role });
                          setModal({ open: true, mode: "edit" });
                        }}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-sm"
                        onClick={() => openVehicles(row)}
                      >
                        🚗 Xe
                      </button>
                      <button
                        className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-sm"
                        onClick={() => handleDeactivate(row)}
                      >
                        🚫 Hủy kích hoạt
                      </button>
                      <button
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
