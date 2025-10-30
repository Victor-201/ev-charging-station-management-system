import { useEffect, useState } from "react";
import adminAPI from "../api/adminAPI";
import { toast } from "react-toastify";

function Users() {
  const [users, setUsers] = useState([]);

  const load = async () => {
    try {
      const res = await adminAPI.users();
      setUsers(res.data?.items ?? []);
    } catch (_) {
      setUsers(
        Array.from({ length: 8 }).map((_, i) => ({
          id: `u-${i + 1}`,
          name: `User ${i + 1}`,
          type: i < 5 ? "Cá nhân" : "Doanh nghiệp",
          status: "Hoạt động",
          role: i % 3 === 0 ? "Admin" : i % 3 === 1 ? "Staff" : "Driver",
        }))
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const assign = async (id, role) => {
    try {
      await adminAPI.assignRole(id, role);
      toast.success("Đã cập nhật vai trò");
      await load();
    } catch (_) {
      toast.info(`Demo: gán vai trò ${role} cho ${id}`);
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-ev-gunmetal">Người dùng & Vai trò</h2>
        <p className="text-sm text-ev-deep/70">Phân quyền, trạng thái hoạt động.</p>
      </div>

      <div className="panel divide-y divide-white/40">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-base font-medium text-ev-gunmetal">{u.name} - {u.type}</p>
              <p className="text-xs text-ev-deep/60">Trạng thái: {u.status} • Vai trò hiện tại: {u.role}</p>
            </div>
            <div className="flex gap-2">
              {['Driver','Staff','Admin'].map(r => (
                <button key={r} onClick={() => assign(u.id, r)} className="px-3 py-2 text-xs font-medium rounded-xl bg-white text-ev-gunmetal border border-ev-deep/20 hover:bg-ev-ice/40 transition-colors">
                  {r}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Users;
