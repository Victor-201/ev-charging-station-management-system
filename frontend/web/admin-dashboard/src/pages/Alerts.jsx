import { useEffect, useState } from "react";
import monitoringAPI from "../api/monitoringAPI";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [level, setLevel] = useState("");

  const load = async () => {
    try {
      const res = await monitoringAPI.alerts({ level });
      setAlerts(res.data?.items ?? []);
    } catch (_) {
      setAlerts([
        { id: 1, station: "ST001", level: "high", message: "Mất kết nối", time: new Date().toISOString() },
        { id: 2, station: "ST014", level: "medium", message: "Công suất cao", time: new Date().toISOString() },
      ]);
    }
  };

  useEffect(() => { load(); }, [level]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Alerts</h2>
        <select value={level} onChange={(e)=>setLevel(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tất cả mức</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="panel divide-y divide-white/40">
        {alerts.map(a => (
          <div key={a.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-ev-gunmetal"><span className="font-semibold">{a.station}</span> • {a.message}</p>
              <p className="text-xs text-ev-deep/60">{new Date(a.time).toLocaleString("vi-VN")} • {a.level.toUpperCase()}</p>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${a.level==='high'?'bg-rose-100 text-rose-600':a.level==='medium'?'bg-amber-100 text-amber-700':'bg-ev-teal/20 text-ev-teal'}`}>{a.level}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Alerts;
