import { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import analyticsAPI from "../api/analyticsAPI";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const fallbackKpis = [
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
  const [kpis, setKpis] = useState(fallbackKpis);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [ovr, mtr] = await Promise.all([
          analyticsAPI.overview(),
          analyticsAPI.metrics({ range: "14d" }),
        ]);
        if (!mounted) return;
        if (ovr.data) {
          const { revenueToday, sessions, offlineRate } = ovr.data;
          setKpis([
            {
              title: "Doanh thu hôm nay",
              value: revenueToday?.label ?? "--",
              description: revenueToday?.desc ?? "",
            },
            {
              title: "Phiên sạc",
              value: sessions?.value ?? "--",
              description: sessions?.desc ?? "",
            },
            {
              title: "Tỷ lệ offline",
              value: offlineRate?.value ?? "--",
              description: offlineRate?.desc ?? "",
            },
          ]);
        }
        if (mtr.data?.series) setSeries(mtr.data.series);
      } catch (_) {
        // dùng fallback nếu API lỗi
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sessions" stroke="#0f766e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
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
