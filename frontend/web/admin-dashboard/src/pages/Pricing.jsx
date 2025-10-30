import { useEffect, useState } from "react";
import pricingAPI from "../api/pricingAPI";
import Modal from "../components/Modal";
import { toast } from "react-toastify";

function Pricing() {
  const [plans, setPlans] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", rule: "Theo kWh • VNĐ", window: "08:00-22:00", area: "" });

  const load = async () => {
    try {
      const res = await pricingAPI.plans();
      setPlans(res.data?.items ?? []);
    } catch (_) {
      setPlans(
        Array.from({ length: 6 }).map((_, i) => ({
          id: i + 1,
          name: `Gói cơ bản #${i + 1}`,
          rule: "Theo kWh • VNĐ",
          window: "08:00-22:00",
          area: "Áp dụng 5 trạm",
        }))
      );
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await pricingAPI.createPlan(form);
      toast.success("Đã tạo biểu giá");
      setOpen(false); setForm({ name: "", rule: "Theo kWh • VNĐ", window: "08:00-22:00", area: "" });
      await load();
    } catch (_) {
      toast.info("Demo: mô phỏng tạo biểu giá");
      setOpen(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Pricing & Plans</h2>
          <p className="text-sm text-white/70">Quản lý biểu giá theo khung giờ và khu vực.</p>
        </div>
        <button onClick={()=>setOpen(true)} className="px-4 py-2 text-sm font-medium rounded-xl bg-ev-teal text-white hover:bg-ev-deep transition-colors">Tạo biểu giá</button>
      </div>

      <div className="panel divide-y divide-white/40">
        {plans.map((plan) => (
          <div key={plan.id ?? plan.name} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 px-4 py-4">
            <div className="flex-1">
              <p className="text-base font-medium text-ev-gunmetal">{plan.name}</p>
              <p className="text-sm text-ev-deep/70">
                {plan.rule} • {plan.window} • {plan.area}
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium rounded-xl bg-white text-ev-gunmetal border border-ev-deep/20 hover:bg-ev-ice/40 transition-colors">
              Chỉnh sửa
            </button>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title="Tạo biểu giá" footer={
        <div className="flex justify-end gap-2">
          <button onClick={()=>setOpen(false)} className="px-4 py-2 text-sm rounded-lg bg-gray-100">Hủy</button>
          <button onClick={create} className="px-4 py-2 text-sm rounded-lg bg-ev-teal text-white">Lưu</button>
        </div>
      }>
        <form onSubmit={create} className="space-y-3">
          <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} placeholder="Tên gói" className="w-full border p-2 rounded-lg" />
          <input value={form.rule} onChange={(e)=>setForm({...form, rule:e.target.value})} placeholder="Loại giá" className="w-full border p-2 rounded-lg" />
          <input value={form.window} onChange={(e)=>setForm({...form, window:e.target.value})} placeholder="Khung giờ" className="w-full border p-2 rounded-lg" />
          <input value={form.area} onChange={(e)=>setForm({...form, area:e.target.value})} placeholder="Phạm vi áp dụng" className="w-full border p-2 rounded-lg" />
        </form>
      </Modal>
    </section>
  );
}

export default Pricing;
