import { useEffect, useState } from "react";
import monitoringAPI from "../api/monitoringAPI";
import Modal from "../components/Modal";
import { toast } from "react-toastify";

function Stations() {
  const [stations, setStations] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: "", address: "" });

  const load = async () => {
    try {
      const res = await monitoringAPI.getStations();
      setStations(res.data?.items ?? []);
    } catch (_) {
      // fallback demo nếu API lỗi
      setStations([
        { id: "ST Station 01", address: "123 Pasteur, Quận 1", status: "Online" },
        { id: "ST Station 02", address: "45 Nguyễn Đình Chiểu, Quận 3", status: "Online" },
        { id: "ST Station 03", address: "28 Võ Văn Kiệt, Quận 5", status: "Bảo trì" },
        { id: "ST Station 04", address: "71 Điện Biên Phủ, Bình Thạnh", status: "Online" },
        { id: "ST Station 05", address: "18 Quốc lộ 1A, Thủ Đức", status: "Offline" },
      ]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await monitoringAPI.createStation(form);
      toast.success("Đã thêm trạm mới");
      setOpen(false);
      setForm({ id: "", address: "" });
      await load();
    } catch (_) {
      toast.error("Không thể thêm trạm (demo dùng dữ liệu giả)");
      setOpen(false);
    }
  };

  const control = async (id, command) => {
    try {
      await monitoringAPI.control(id, command);
      toast.success(`${command.toUpperCase()} thành công`);
      await load();
    } catch (_) {
      toast.info(`Demo: mô phỏng ${command} cho ${id}`);
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Danh sách trạm</h2>
          <p className="text-sm text-white/70">Quản lý trạng thái, công suất và bảo trì.</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 text-sm font-medium rounded-xl bg-ev-sky/80 text-ev-gunmetal hover:bg-ev-sky transition-colors">Thêm trạm</button>
      </div>

      <div className="panel divide-y divide-white/40">
        {stations.map((station) => (
          <div key={station.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 px-4 py-4">
            <div className="flex-1">
              <p className="text-base font-medium text-ev-gunmetal">{station.id}</p>
              <p className="text-sm text-ev-deep/70">{station.address}</p>
            </div>
            <span
              className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${
                station.status === "Online"
                  ? "bg-ev-teal/20 text-ev-teal"
                  : station.status === "Bảo trì"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-rose-100 text-rose-600"
              }`}
            >
              {station.status}
            </span>
            <div className="flex gap-2">
              <button onClick={() => control(station.id, "start")} className="px-3 py-2 text-xs font-medium rounded-xl bg-white text-ev-gunmetal border border-ev-deep/20 hover:bg-ev-ice/40 transition-colors">Start</button>
              <button onClick={() => control(station.id, "stop")} className="px-3 py-2 text-xs font-medium rounded-xl bg-white text-ev-gunmetal border border-ev-deep/20 hover:bg-ev-ice/40 transition-colors">Stop</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Thêm trạm mới" footer={
        <div className="flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-lg bg-gray-100">Hủy</button>
          <button onClick={create} className="px-4 py-2 text-sm rounded-lg bg-ev-teal text-white">Lưu</button>
        </div>
      }>
        <form onSubmit={create} className="space-y-3">
          <input value={form.id} onChange={(e)=>setForm({...form, id:e.target.value})} placeholder="Mã trạm" className="w-full border p-2 rounded-lg" />
          <input value={form.address} onChange={(e)=>setForm({...form, address:e.target.value})} placeholder="Địa chỉ" className="w-full border p-2 rounded-lg" />
        </form>
      </Modal>
    </section>
  );
}

export default Stations;
