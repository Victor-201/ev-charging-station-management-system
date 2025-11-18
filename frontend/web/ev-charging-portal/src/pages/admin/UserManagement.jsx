import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import apiClient from "@/api/apiClient";

/**
 * Admin – Quản lý User
 * - GET    /api/v1/admin/users
 * - PUT    /api/v1/admin/users/:id
 * - DELETE /api/v1/admin/users/:id
 * - Các thao tác: đổi role, active/block user, xoá user
 */
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ============================
  // LOAD USER LIST
  // ============================
  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/api/v1/admin/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error("[UserManagement] load error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách người dùng."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ============================
  // FILTER CLIENT SIDE
  // ============================
  const filteredUsers = users.filter((u) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q) ||
      (u.id || "").toLowerCase().includes(q)
    );
  });

  // ============================
  // UPDATE USER
  // ============================
  const updateUser = async (id, patch) => {
    setSaving(true);
    try {
      await apiClient.put(`/api/v1/admin/users/${id}`, patch);
      await loadUsers();
    } catch (err) {
      console.error("update user error:", err);
      alert(
        err?.response?.data?.message ||
          "Không thể cập nhật user, xem console để biết thêm."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = (u) => {
    updateUser(u.id, { active: !u.active });
  };

  const changeRole = (u, role) => {
    updateUser(u.id, { role });
  };

  const deleteUser = async (id) => {
    if (
      !window.confirm(
        "Xoá người dùng này? Tất cả session/token liên quan sẽ bị vô hiệu."
      )
    ) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/admin/users/${id}`);
      await loadUsers();
    } catch (err) {
      console.error("delete user error:", err);
      alert("Không thể xoá user.");
    }
  };

  // ============================
  // UI RENDER
  // ============================
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="User Management"
          subtitle="Quản lý tài khoản Driver / Staff / Admin qua API gateway."
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Section title="Danh sách người dùng">
          <div className="flex justify-between items-center mb-3">
            <input
              placeholder="Tìm theo email, tên, ID..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full max-w-xs border rounded-lg px-3 py-2 text-sm"
            />

            <button
              onClick={loadUsers}
              disabled={loading}
              className="ml-3 px-3 py-2 rounded-lg border text-sm"
            >
              {loading ? "Đang tải..." : "Refresh"}
            </button>
          </div>

          {loading && filteredUsers.length === 0 ? (
            <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
          ) : (
            <Table
              columns={[
                "ID",
                "Tên",
                "Email",
                "Role",
                "Active",
                "Tạo lúc",
                "",
              ]}
              rows={filteredUsers.map((u) => [
                u.id,
                u.name,
                u.email,
                u.role,
                u.active ? "Yes" : "No",
                u.created_at,
                "actions",
              ])}
              renderRow={(row, index) => {
                const u = filteredUsers[index];
                return (
                  <tr
                    key={u.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 text-xs text-slate-500">{u.id}</td>
                    <td className="px-3 py-2 text-sm">{u.name}</td>
                    <td className="px-3 py-2 text-sm">{u.email}</td>

                    {/* ROLE */}
                    <td className="px-3 py-2">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        disabled={saving}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="driver">driver</option>
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>

                    {/* ACTIVE */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={saving}
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {u.active ? "Active" : "Blocked"}
                      </button>
                    </td>

                    <td className="px-3 py-2 text-xs text-slate-500">
                      {u.created_at}
                    </td>

                    {/* DELETE */}
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="text-xs px-2 py-1 rounded bg-red-600 text-white"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                );
              }}
            />
          )}
        </Section>
      </div>
    </div>
  );
}
