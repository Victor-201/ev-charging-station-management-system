import { useEffect, useState } from "react";
import analyticsAPI from "../api/analyticsAPI";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

function Forecast() {
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await analyticsAPI.reports({ type: "forecast" });
        setData(res.data?.series ?? []);
      } catch (_) {
        setData(
          Array.from({ length: 14 }).map((_, i) => ({
            day: `D${i + 1}`,
            demand: 80 + Math.round(Math.random() * 40),
          }))
        );
      }
    })();
  }, []);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Forecast (AI)</h2>
      <div className="panel p-6 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="demand" stroke="#0f766e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default Forecast;
