import { useEffect, useState } from "react";
import Section from "@/components/admin/Section";
import PageHeader from "@/components/admin/PageHeader";
import Table from "@/components/admin/Table";
import { useUser } from "@/hooks/useUser";

export default function UserManagement() {
  const { fetchAllUsers, updateUser, deleteUser, loading, error } = useUser();

  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [displayedUsers, setDisplayedUsers] = useState([]);

  /* =======================
        RESET PAGE WHEN FILTER CHANGES
  ======================= */
  useEffect(() => {
    setPage(1);
  }, [filter]);

  /* =======================
        FETCH USERS
  ======================= */
  useEffect(() => {
    fetchAllUsers({ page, size, q: filter })
      .then((res) => {
        setTotal(res.total || 0);
        setDisplayedUsers(res.users || []);
      })
      .catch(() => {});
  }, [page, size, filter, fetchAllUsers]);

  /* =======================
        TABLE COLUMNS
  ======================= */
  const columns = [
    {
      key: "full_name",
      title: "Họ tên",
      dataIndex: "full_name",
      render: (value) => value || <span className="text-gray-400 italic">Chưa có</span>,
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
      render: (value) => <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{value}</span>,
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (value, row) => (
        <select
          value={value}
          onChange={(e) => updateUser(row.user_id, { status: e.target.value })}
          className={`border rounded px-2 py-1 text-xs ${
            value === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
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
        <button onClick={() => deleteUser(row.user_id)} className="text-xs px-2 py-1 rounded bg-red-600 text-white">
          Xoá
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="User Management" subtitle="Quản lý tài khoản người dùng" />

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error?.message || "Không thể tải danh sách người dùng."}
          </div>
        )}

        <Section title="Danh sách người dùng">
          {/* TOTAL */}
          <div className="mb-2 text-sm text-gray-600">Tổng số người dùng: {total}</div>

          {/* SEARCH + REFRESH + PAGINATION */}
          <div className="flex justify-between items-center mb-3 gap-3">
            <div className="flex gap-3">
              <input
                placeholder="Tìm theo họ tên, email, ID, role..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full max-w-xs border rounded-lg px-3 py-2 text-sm"
              />

              <button
                onClick={() =>
                  fetchAllUsers({ page, size, q: filter }).then((res) => {
                    setTotal(res.total || 0);
                    setDisplayedUsers(res.users || []);
                  })
                }
                className="px-3 py-2 rounded-lg border text-sm"
                disabled={loading}
              >
                {loading ? "Đang tải..." : "Refresh"}
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <button
                className="px-3 py-1 border rounded"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>

              <span className="text-sm">
                Page {page} / {Math.ceil(total / size) || 1}
              </span>

              <button
                className="px-3 py-1 border rounded"
                disabled={page >= Math.ceil(total / size)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>

          {/* TABLE */}
          <Table columns={columns} data={displayedUsers} />
        </Section>
      </div>
    </div>
  );
}
