const plans = [
  {
    name: "Gói cơ bản #1",
    rule: "Theo kWh • VNĐ",
    window: "08:00-22:00",
    area: "Áp dụng 5 trạm"
  },
  {
    name: "Gói cơ bản #2",
    rule: "Theo kWh • VNĐ",
    window: "08:00-22:00",
    area: "Áp dụng 8 trạm"
  },
  {
    name: "Gói cơ bản #3",
    rule: "Theo kWh • VNĐ",
    window: "08:00-22:00",
    area: "Áp dụng 6 trạm"
  },
  {
    name: "Gói cơ bản #4",
    rule: "Theo kWh • VNĐ",
    window: "08:00-22:00",
    area: "Áp dụng 3 trạm"
  }
];

function Pricing() {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ev-gunmetal">Pricing & Plans</h2>
          <p className="text-sm text-ev-deep/70">Quản lý biểu giá theo khung giờ và khu vực.</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium rounded-xl bg-ev-teal text-white hover:bg-ev-deep transition-colors">
          Tạo biểu giá
        </button>
      </div>

      <div className="panel divide-y divide-white/40">
        {plans.map((plan) => (
          <div key={plan.name} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 px-4 py-4">
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
    </section>
  );
}

export default Pricing;
