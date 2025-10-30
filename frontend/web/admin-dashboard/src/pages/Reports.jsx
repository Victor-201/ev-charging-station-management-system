function Reports() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-ev-gunmetal">Reports</h2>
        <p className="text-sm text-ev-deep/70">
          Tổng hợp KPI, doanh thu theo ngày, hiệu suất trạm và dữ liệu xuất khẩu.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6 h-72">
          <h3 className="text-lg font-semibold text-ev-gunmetal">KPI</h3>
          <p className="text-sm text-ev-deep/60">Placeholder bảng số liệu KPI. Sẽ tích hợp dữ liệu thật sau.</p>
        </div>
        <div className="panel p-6 h-72">
          <h3 className="text-lg font-semibold text-ev-gunmetal">Phiên sạc theo ngày - 14 ngày</h3>
          <p className="text-sm text-ev-deep/60">Placeholder biểu đồ cột/đường.</p>
        </div>
        <div className="panel p-6 h-72 lg:col-span-2">
          <h3 className="text-lg font-semibold text-ev-gunmetal">Xuất dữ liệu</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <button className="px-4 py-3 text-sm font-medium rounded-xl bg-ev-teal text-white hover:bg-ev-deep transition-colors">
              Tải báo cáo doanh thu
            </button>
            <button className="px-4 py-3 text-sm font-medium rounded-xl bg-white text-ev-gunmetal border border-ev-deep/20 hover:bg-ev-ice/40 transition-colors">
              Tải chi tiết phiên sạc
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Reports;
