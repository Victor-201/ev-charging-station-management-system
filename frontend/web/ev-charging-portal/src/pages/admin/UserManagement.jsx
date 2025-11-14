// pages/admin/UserManagement.jsx
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Section from "@/components/admin/Section";
import Table from "@/components/admin/Table";
import useApi from "@/hooks/useApi";

/**
 * Trang Quản lý người dùng:
 * - Dùng hook useApi() để gọi trực tiếp REST API admin user
 * - Không dùng localStorage, tất cả thao tác qua backend
 *
 * Giả định API gateway:
 *   GET    /api/v1/admin/users            -> danh sách user
 *   PUT    /api/v1/admin/users/:id        -> cập nhật user (role, status...)
 *   DELETE /api/v1/admin/users/:id        -> vô hiệu hoá user
 *
 * Nếu backend của bạn khác endpoint -> chỉ cần đổi URL trong hàm fetchUsers / updateUser / deleteUser.
 */

export default function UserManagementPage() {
  const { loading, get, put, del } = useApi();

  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setError(null);
      const data = await get("/api/v1/admin/users");
      setUsers(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelect = (user) => {
    setSelected(user);
    setRole(user.role || "");
    setStatus(user.status || "");
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      setError(null);
      const updated = await put(`/api/v1/admin/users/${selected.id}`, {
        role,
        status,
      });
      // Cập nhật lại danh sách local
      setUsers((prev) =>
        prev.map((u) => (u.id === selected.id ? { ...u, ...updated } : u))
      );
      setSelected({ ...selected, ...updated });
    } catch (err) {
      setError(err);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm("Bạn có chắc muốn vô hiệu hoá / xoá người dùng này?"))
      return;
    try {
      setError(null);
      await del(`/api/v1/admin/users/${selected.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== selected.id));
      setSelected(null);
    } catch (err) {
      setError(err);
    }
  };

  // Lọc theo search (email / name / id)
  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q) ||
      String(u.id || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        subtitle="Xem và quản lý tài khoản người dùng trong hệ thống"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Lỗi:</strong>{" "}
          {error.response?.data?.message ||
            error.message ||
            "Có lỗi xảy ra khi thao tác với người dùng"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sách user */}
        <Section title="Danh sách người dùng" className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo email, tên hoặc ID..."
              className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="ml-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Làm mới
            </button>
          </div>

          <Table
            columns={["ID", "Email", "Tên", "Vai trò", "Trạng thái"]}
            rows={filteredUsers.map((u) => [
              u.id,
              u.email,
              u.name || "—",
              u.role || "user",
              u.status || "active",
            ])}
            // Nếu Table có hỗ trợ onRowClick – tuỳ component của bạn
            onRowClick={(rowIndex) => handleSelect(filteredUsers[rowIndex])}
          />
          <p className="mt-2 text-xs text-gray-400">
            * Nhấp vào một dòng (row) để xem và chỉnh sửa chi tiết ở panel bên
            phải (nếu Table hỗ trợ onRowClick).
          </p>
        </Section>

        {/* Panel chi tiết user */}
        <Section title="Chi tiết người dùng" className="lg:col-span-1">
          {!selected ? (
            <div className="text-sm text-gray-500">
              Chọn một người dùng trong bảng để xem chi tiết.
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-1">ID</div>
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-mono">
                  {selected.id}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Email</div>
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                  {selected.email}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Tên hiển thị</div>
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                  {selected.name || "—"}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Vai trò (Role)</div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">
                  Trạng thái tài khoản
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Vô hiệu hoá / xoá
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
