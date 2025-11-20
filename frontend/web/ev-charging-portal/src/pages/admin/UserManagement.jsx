import { useEffect, useState } from "react";

import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";

import { useUser } from "@/hooks/useUser";

export default function UserManagement() {
  const {
    userList,
    fetchAllUsers,
    updateUser,
    deleteUser,
    loading,
    error,
  } = useUser();

  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchAllUsers().catch(() => {});
  }, [fetchAllUsers]);

  /* =======================
        FILTER
  ======================= */
  const filteredUsers = userList.filter((u) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;

    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.user_id || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q)
    );
  });

  /* =======================
        TABLE COLUMNS
  ======================= */
  const columns = [
    {
      key: "full_name",
      title: "Họ tên",
      dataIndex: "full_name",
      render: (value) =>
        value ? (
          value
        ) : (
          <span className="text-gray-400 italic">Chưa có</span>
        ),
    },

    { key: "email", title: "Email", dataIndex: "email" },

    {
      key: "phone",
      title: "Phone",
      dataIndex: "phone",
      render: (v) => v || <span className="text-gray-400">N/A</span>,
    },

    {
      key: "role",
      title: "Role",
      dataIndex: "role",
      render: (value) => (
        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
          {value}
        </span>
      ),
    },

    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (value, row) => (
        <select
          value={value}
          onChange={(e) =>
            updateUser(row.user_id, { status: e.target.value })
          }
          className={`border rounded px-2 py-1 text-xs ${
            value === "active"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      ),
    },

    { key: "created_at", title: "Created At", dataIndex: "created_at" },

    {
      key: "actions",
      title: "",
      dataIndex: "actions",
      render: (_, row) => (
        <button
          onClick={() => deleteUser(row.user_id)}
          className="text-xs px-2 py-1 rounded bg-red-600 text-white"
        >
          Xoá
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="User Management"
          subtitle="Quản lý tài khoản người dùng"
        />

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error?.message || "Không thể tải danh sách người dùng."}
          </div>
        )}

        <Section title="Danh sách người dùng">
          {/* SEARCH + REFRESH */}
          <div className="flex justify-between items-center mb-3">
            <input
              placeholder="Tìm theo họ tên, email, ID, role..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full max-w-xs border rounded-lg px-3 py-2 text-sm"
            />

            <button
              onClick={fetchAllUsers}
              className="ml-3 px-3 py-2 rounded-lg border text-sm"
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Refresh"}
            </button>
          </div>

          {/* TABLE */}
          <Table columns={columns} data={filteredUsers} />
        </Section>
      </div>
    </div>
  );
}
