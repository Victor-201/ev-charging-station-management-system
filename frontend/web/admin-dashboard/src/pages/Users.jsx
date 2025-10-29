const users = [
  "User 1 - Cá nhân",
  "User 2 - Cá nhân",
  "User 3 - Cá nhân",
  "User 4 - Cá nhân",
  "User 5 - Cá nhân",
  "User 6 - Doanh nghiệp",
  "User 7 - Doanh nghiệp",
  "User 8 - Doanh nghiệp"
];

function Users() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-ev-gunmetal">Người dùng & Vai trò</h2>
        <p className="text-sm text-ev-deep/70">Phân quyền, trạng thái hoạt động.</p>
      </div>

      <div className="panel divide-y divide-white/40">
        {users.map((user) => (
          <div key={user} className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-base font-medium text-ev-gunmetal">{user}</p>
              <p className="text-xs text-ev-deep/60">Trạng thái: Hoạt động • Vai trò: Driver/Admin/Staff</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium rounded-xl bg-white text-ev-gunmetal border border-ev-deep/20 hover:bg-ev-ice/40 transition-colors">
              Phân quyền
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Users;
