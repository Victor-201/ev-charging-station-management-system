// pages/admin/UserManagement.jsx
import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import apiClient from "@/api/apiClient";

const ROLE_LABEL = {
  admin: "Quản trị viên",
  staff: "Nhân viên trạm",
  user: "Người dùng",
};

const STATUS_COLOR = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-gray-50 text-gray-700",
  suspended: "bg-red-50 text-red-700",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");

      const res = await apiClient({
        method: "GET",
        url: "/api/v1/users/admin",
      });

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("User list error:", err);
      setError("Không tải được danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // Thay đổi trạng thái user
  async function updateUserStatus(userId, newStatus) {
    try {
      setSavingId(userId);
      setError("");

      await apiClient({
        method: "PATCH",
        url: `/api/v1/users/${userId}/status`,
        data: { status: newStatus },
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: newStatus } : u
        )
      );
    } catch (err) {
      console.error("Update user status error:", err);
      setError("Không cập nhật được trạng thái người dùng.");
    } finally {
      setSavingId("");
    }
  }

  // Lọc theo role / status
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý người dùng"
        subtitle="Xem, lọc và quản lý tài khoản người dùng trong hệ thống"
      />

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Section title="Bộ lọc">
        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc theo vai trò */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Vai trò:</span>
            <select
              className="border rounded-lg px-3 py-1 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
              <option value="user">Người dùng</option>
            </select>
          </div>

          {/* Lọc theo trạng thái */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Trạng thái:</span>
            <select
              className="border rounded-lg px-3 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="suspended">Bị khóa</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            className="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Làm mới
          </button>
        </div>
      </Section>

      <Section title="Danh sách người dùng">
        {loading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
        ) : filteredUsers.length === 0 ? (
          <div className="text-sm text-gray-500">
            Không có người dùng phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Họ tên</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Số điện thoại</th>
                  <th className="py-2 pr-4">Vai trò</th>
                  <th className="py-2 pr-4">Trạng thái</th>
                  <th className="py-2 pr-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="py-2 pr-4 font-medium">
                      {u.full_name || u.name || "-"}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {u.email}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {u.phone || "-"}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {ROLE_LABEL[u.role] || u.role}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLOR[u.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.status === "active"
                          ? "Đang hoạt động"
                          : u.status === "inactive"
                          ? "Không hoạt động"
                          : u.status === "suspended"
                          ? "Bị khóa"
                          : u.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => updateUserStatus(u.id, "active")}
                        disabled={
                          savingId === u.id || u.status === "active"
                        }
                        className="text-xs px-3 py-1 rounded-lg border border-emerald-500 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        Mở khóa
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateUserStatus(u.id, "suspended")
                        }
                        disabled={savingId === u.id}
                        className="text-xs px-3 py-1 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Khóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
