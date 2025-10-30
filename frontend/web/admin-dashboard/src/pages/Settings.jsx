import { useEffect, useState } from "react";
import settingsAPI from "../api/settingsAPI";
import { toast } from "react-toastify";

function Settings() {
  const [cfg, setCfg] = useState({ alertThreshold: 80, email: "admin@example.com" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await settingsAPI.get();
        if (res.data) setCfg(res.data);
      } catch (_) {
        // fallback giữ mặc định
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await settingsAPI.update(cfg);
      toast.success("Đã lưu cấu hình");
    } catch (_) {
      toast.info("Demo: mô phỏng lưu cấu hình");
    }
  };

  const backup = async () => {
    try {
      await settingsAPI.backup();
      toast.success("Đã tạo backup hệ thống");
    } catch (_) {
      toast.info("Demo: mô phỏng backup");
    }
  };

  if (loading) return <p className="text-sm text-ev-deep/60">Đang tải cấu hình…</p>;

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Settings</h2>
      <form onSubmit={save} className="panel p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm text-ev-gunmetal">Ngưỡng cảnh báo (%)</span>
            <input type="number" value={cfg.alertThreshold} onChange={(e)=>setCfg({...cfg, alertThreshold:Number(e.target.value)})} className="w-full border p-2 rounded-lg" />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-ev-gunmetal">Email nhận cảnh báo</span>
            <input value={cfg.email} onChange={(e)=>setCfg({...cfg, email:e.target.value})} className="w-full border p-2 rounded-lg" />
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-ev-teal text-white">Lưu</button>
          <button type="button" onClick={backup} className="px-4 py-2 text-sm rounded-lg bg-white border border-ev-deep/20">Backup</button>
        </div>
      </form>
    </section>
  );
}

export default Settings;
