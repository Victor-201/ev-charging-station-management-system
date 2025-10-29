import Card from "../components/Card.jsx";

const kpis = [
  {
    title: "Doanh thu hôm nay",
    value: "15.2 triệu",
    description: "Bao gồm 48 phiên sạc hoàn tất"
  },
  {
    title: "Phiên sạc",
    value: "128",
    description: "+12% so với cùng kỳ"
  },
  {
    title: "Tỷ lệ offline",
    value: "2.3%",
    description: "4 trạm cần kiểm tra"
  }
];

function Overview() {
  return (
    <section className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        {kpis.map((item) => (
          <Card key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="panel p-6 h-80">
          <h2 className="text-lg font-semibold text-ev-gunmetal mb-2">Biểu đồ 14 ngày</h2>
          <p className="text-sm text-ev-deep/60">Placeholder cho biểu đồ đường (sẽ tích hợp sau).</p>
        </div>
        <div className="panel p-6 h-80">
          <h2 className="text-lg font-semibold text-ev-gunmetal mb-2">Top trạm/sự cố</h2>
          <ul className="space-y-4 text-sm text-ev-deep/80">
            <li>
              <span className="font-semibold text-ev-gunmetal">ST001</span> - Quận 1 - 4 cảnh báo trong 24h
            </li>
            <li>
              <span className="font-semibold text-ev-gunmetal">ST014</span> - Đà Nẵng - 2 cảnh báo pin yếu
            </li>
            <li>
              <span className="font-semibold text-ev-gunmetal">ST022</span> - Cần Thơ - 98% công suất
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Overview;
