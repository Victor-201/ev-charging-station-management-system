const stations = [
  {
    id: "ST Station 01",
    address: "123 Pasteur, Quận 1",
    status: "Online"
  },
  {
    id: "ST Station 02",
    address: "45 Nguyễn Đình Chiểu, Quận 3",
    status: "Online"
  },
  {
    id: "ST Station 03",
    address: "28 Võ Văn Kiệt, Quận 5",
    status: "Bảo trì"
  },
  {
    id: "ST Station 04",
    address: "71 Điện Biên Phủ, Bình Thạnh",
    status: "Online"
  },
  {
    id: "ST Station 05",
    address: "18 Quốc lộ 1A, Thủ Đức",
    status: "Offline"
  }
];

function Stations() {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ev-gunmetal">Danh sách trạm</h2>
          <p className="text-sm text-ev-deep/70">Quản lý trạng thái, công suất và bảo trì.</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium rounded-xl bg-ev-sky/80 text-ev-gunmetal hover:bg-ev-sky transition-colors">
          Thêm trạm
        </button>
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
            <button className="px-4 py-2 text-sm font-medium rounded-xl bg-white text-ev-gunmetal border border-ev-deep/20 hover:bg-ev-ice/40 transition-colors">
              Chi tiết
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Stations;
