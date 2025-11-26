import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import chargingControlService from "@/services/chargingControlService";
import stationService from "@/services/stationService";
import { useAuth } from "@/hooks/useAuth";
import { useStation } from "@/hooks/useStation";

/**
 * Reports component
 * Props:
 *  - stationId: string (optional) — nếu có sẽ ưu tiên dùng, nếu không sẽ cố resolve
 */
export default function Reports({ stationId: propStationId }) {
  const { user } = useAuth?.() ?? {};
  const { currentStation } = useStation?.() ?? {};
  const token = user?.token || user?.access_token || user?.jwt || null;

  // managed station id resolve
  const [managedStationId, setManagedStationId] = useState(propStationId || null);
  const [resolvingStation, setResolvingStation] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  // date filter chosen by user (client-side)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // base data (from daily-summary) — chứa hourlyData + dailyStats for selectedDate
  const [baseData, setBaseData] = useState({
    hourlyData: Array.from({ length: 24 }, (_, i) => ({ hour: i, sessions: 0 })),
    dailyStats: { totalSessions: 0, totalRevenue: 0, totalMinutes: 0 }
  });
  const [loadingBase, setLoadingBase] = useState(false);
  const [errorBase, setErrorBase] = useState(null);

  // peak info (from peak-hours API)
  // peakInfo: { map: Map(hour->count), set: Set(hoursMarkedPeak), raw: any }
  const [peakInfo, setPeakInfo] = useState({ map: new Map(), set: new Set(), raw: null });
  const [loadingPeak, setLoadingPeak] = useState(false);
  const [errorPeak, setErrorPeak] = useState(null);

  // UI-level combined loading / error
  const loading = loadingBase || loadingPeak;
  const error = errorBase || errorPeak;

  // Resolve managedStationId once (prop -> currentStation -> localStorage -> API -> token claims)
  const resolveManagedStationId = useCallback(async () => {
    if (propStationId) {
      setManagedStationId(propStationId);
      return;
    }

    if (currentStation?.id) {
      setManagedStationId(currentStation.id);
      try { window.localStorage.setItem("managedStationId", currentStation.id); } catch (e) {}
      return;
    }

    try {
      const fromStorage = window.localStorage.getItem("managedStationId");
      if (fromStorage) {
        setManagedStationId(fromStorage);
        return;
      }
    } catch (e) {}

    if (stationService && typeof stationService.getAssignedStation === "function") {
      try {
        setResolvingStation(true);
        setResolveError(null);
        const opts = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
        const res = await stationService.getAssignedStation(opts);
        const payload = res?.data ?? res;

        if (!payload) throw new Error("API không trả về dữ liệu.");

        let maybeId = null;
        if (payload.id) maybeId = payload.id;
        else if (Array.isArray(payload) && payload.length > 0 && payload[0].id) maybeId = payload[0].id;
        else maybeId = payload.station_id || payload.stationId || payload.id || null;

        if (maybeId) {
          setManagedStationId(maybeId);
          try { window.localStorage.setItem("managedStationId", maybeId); } catch (e) {}
          setResolvingStation(false);
          return;
        }
        setResolvingStation(false);
      } catch (err) {
        setResolveError(err);
        setResolvingStation(false);
      }
    }

    // try parse token claims (if JWT)
    if (token && token.split && token.split(".").length === 3) {
      try {
        const payloadJson = JSON.parse(atob(token.split(".")[1]));
        const maybeId = payloadJson.station_id || payloadJson.stationId || payloadJson.assigned_station || null;
        if (maybeId) {
          setManagedStationId(maybeId);
          try { window.localStorage.setItem("managedStationId", maybeId); } catch (e) {}
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    // not found -> leave as null
  }, [propStationId, currentStation, token]);

  // --- Fetch daily summary (no date passed to API). We will filter client-side by selectedDate ---
  const fetchDailySummary = useCallback(async (sid) => {
    setLoadingBase(true);
    setErrorBase(null);
    try {
      const res = await chargingControlService.getDailySummaryByStation(sid);
      const payload = res?.data ?? res;
      const summary = payload?.summary ?? {};

      const summaryForDate = summary[selectedDate] ?? null;

      // build hourly + totals from the summary for the chosen date
      const hourly = Array.from({ length: 24 }, (_, i) => ({ hour: i, sessions: 0 }));
      if (summaryForDate && Array.isArray(summaryForDate.sessions)) {
        summaryForDate.sessions.forEach((s) => {
          const start = s.started_at ? new Date(s.started_at) : null;
          const hour = start ? start.getHours() : null;
          if (hour !== null && hour >= 0 && hour <= 23) hourly[hour].sessions += 1;
        });
      }

      const totalSessions = summaryForDate?.total_sessions ?? 0;
      const totalMinutes = summaryForDate?.total_minutes ?? 0;
      const totalAmount = summaryForDate?.total_amount ?? 0;

      setBaseData({
        hourlyData: hourly,
        dailyStats: {
          totalSessions,
          totalRevenue: totalAmount,
          totalMinutes
        }
      });
      setLoadingBase(false);
      return { success: true, raw: payload };
    } catch (err) {
      console.error("fetchDailySummary error:", err);
      setErrorBase(err);
      setLoadingBase(false);
      // reset baseData
      setBaseData({
        hourlyData: Array.from({ length: 24 }, (_, i) => ({ hour: i, sessions: 0 })),
        dailyStats: { totalSessions: 0, totalRevenue: 0, totalMinutes: 0 }
      });
      return { success: false, error: err };
    }
  }, [selectedDate]);

  // --- Fetch peak hours info from chargingControlService.getPeakHours(station_id) ---
  const fetchPeakHours = useCallback(async (sid) => {
    setLoadingPeak(true);
    setErrorPeak(null);
    try {
      const res = await chargingControlService.getPeakHours(sid);
      const payload = res?.data ?? res;

      // Xử lý format mới: { station_id: "...", peak_hours: { "0": 0, "1": 0, "2": 1, ... } }
      const map = new Map(); // hour -> count
      const set = new Set(); // hours marked as peak (count > 0)
      
      if (!payload) {
        // empty
      } else if (payload.peak_hours && typeof payload.peak_hours === "object") {
        // Format mới: { peak_hours: { "0": 0, "1": 0, "2": 1, ... } }
        Object.keys(payload.peak_hours).forEach(k => {
          const h = Number(k);
          const c = Number(payload.peak_hours[k] ?? 0);
          if (!Number.isNaN(h) && h >= 0 && h <= 23) {
            map.set(h, c);
            if (c > 0) set.add(h); // Đánh dấu là peak nếu count > 0
          }
        });
      } else if (Array.isArray(payload)) {
        // payload = [17,18] or [{hour:17,count:10},...]
        if (payload.length > 0 && typeof payload[0] === "number") {
          payload.forEach(h => { map.set(Number(h), 0); set.add(Number(h)); });
        } else if (payload.length > 0 && typeof payload[0] === "object") {
          payload.forEach(item => {
            const h = Number(item.hour ?? item.h ?? item.hour_of_day);
            const c = Number(item.count ?? item.sessions ?? item.value ?? 0);
            if (!Number.isNaN(h)) { map.set(h, c); if (c > 0) set.add(h); }
          });
        }
      } else if (typeof payload === "object") {
        // Fallback: các format khác
        if (Array.isArray(payload.peak_hours)) {
          payload.peak_hours.forEach(h => { map.set(Number(h), 0); set.add(Number(h)); });
        }
        if (Array.isArray(payload.hours)) {
          payload.hours.forEach(item => {
            if (typeof item === "number") { map.set(Number(item), 0); set.add(Number(item)); }
            else if (typeof item === "object") {
              const h = Number(item.hour ?? item.h);
              const c = Number(item.count ?? item.sessions ?? 0);
              if (!Number.isNaN(h)) { map.set(h, c); if (c > 0) set.add(h); }
            }
          });
        }
        if (payload.counts && typeof payload.counts === "object") {
          Object.keys(payload.counts).forEach(k => {
            const h = Number(k);
            const c = Number(payload.counts[k] ?? 0);
            if (!Number.isNaN(h)) { map.set(h, c); if (c > 0) set.add(h); }
          });
        }
      }

      setPeakInfo({ map, set, raw: payload });
      setLoadingPeak(false);
      return { success: true, raw: payload };
    } catch (err) {
      console.error("fetchPeakHours error:", err);
      setErrorPeak(err);
      setLoadingPeak(false);
      setPeakInfo({ map: new Map(), set: new Set(), raw: null });
      return { success: false, error: err };
    }
  }, []);

  // Combine baseData and peakInfo into displayData (memo)
  const displayData = useMemo(() => {
    const hourlyClone = baseData.hourlyData.map(h => ({ ...h })); // [{hour, sessions}]
    const map = peakInfo.map;
    const set = peakInfo.set;

    // add peakCount and isPeak to each hour entry
    const sessionsArray = hourlyClone.map((entry) => {
      const hour = entry.hour;
      const peakCount = map.has(hour) ? Number(map.get(hour) || 0) : 0;
      const isPeak = set.has(hour);
      return { ...entry, peakCount, isPeak };
    });

    return {
      hourlyData: sessionsArray,
      dailyStats: baseData.dailyStats
    };
  }, [baseData, peakInfo]);

  // Tính toán thống kê để phân loại màu thông minh
  const colorStats = useMemo(() => {
    const values = displayData.hourlyData.map(d => d.peakCount);
    const nonZeroValues = values.filter(v => v > 0);
    
    if (nonZeroValues.length === 0) {
      return { mean: 0, stdDev: 0, max: 0 };
    }
    
    const sum = nonZeroValues.reduce((a, b) => a + b, 0);
    const mean = sum / nonZeroValues.length;
    
    const squaredDiffs = nonZeroValues.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / nonZeroValues.length;
    const stdDev = Math.sqrt(variance);
    
    const max = Math.max(...values);
    
    return { mean, stdDev, max };
  }, [displayData]);

  // Hàm phân màu thông minh dựa trên độ đột biến
  const getSmartColor = useCallback((peakCount) => {
    if (peakCount === 0) return "#22c55e"; // Xanh lá - không có peak
    
    const { mean, stdDev, max } = colorStats;
    
    // Nếu tất cả giá trị giống nhau
    if (stdDev === 0) {
      return peakCount > 0 ? "#eab308" : "#22c55e"; // Vàng nếu có giá trị, xanh nếu không
    }
    
    // Tính z-score để đánh giá độ đột biến
    const zScore = (peakCount - mean) / stdDev;
    
    // Đỏ: cao đột biến (z-score > 1.5 hoặc > 80% max)
    if (zScore > 1.5 || peakCount > max * 0.8) {
      return "#ef4444"; // Đỏ
    }
    
    // Vàng: trung bình đến cao (z-score > 0 hoặc > 40% max)
    if (zScore > 0 || peakCount > max * 0.4) {
      return "#eab308"; // Vàng
    }
    
    // Xanh: thấp
    return "#22c55e"; // Xanh lá
  }, [colorStats]);

  // Hàm lấy nhãn mức độ
  const getIntensityLabel = useCallback((peakCount) => {
    if (peakCount === 0) return "Không có";
    
    const { mean, stdDev, max } = colorStats;
    
    if (stdDev === 0) {
      return peakCount > 0 ? "Bình thường" : "Không có";
    }
    
    const zScore = (peakCount - mean) / stdDev;
    
    if (zScore > 1.5 || peakCount > max * 0.8) {
      return "Cao đột biến";
    }
    
    if (zScore > 0 || peakCount > max * 0.4) {
      return "Trung bình";
    }
    
    return "Thấp";
  }, [colorStats]);

  // compute maxSessions for chart color scale (dùng sessions từ daily summary)
  const maxSessions = useMemo(() => Math.max(...displayData.hourlyData.map(d => d.sessions), 0), [displayData]);

  // When managedStationId resolved -> fetch both base and peak concurrently
  useEffect(() => {
    if (!managedStationId) return;
    let mounted = true;

    (async () => {
      // Fetch both in parallel
      await Promise.all([fetchDailySummary(managedStationId), fetchPeakHours(managedStationId)]);
      // safe: states updated in respective functions
      if (!mounted) return;
    })();

    return () => { mounted = false; };
  }, [managedStationId, fetchDailySummary, fetchPeakHours]);

  // resolve managedStationId on mount / when deps change
  useEffect(() => {
    let mounted = true;
    (async () => {
      await resolveManagedStationId();
      if (!mounted) return;
    })();
    return () => { mounted = false; };
  }, [resolveManagedStationId]);

  // Helper: format currency
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN").format(Number(amount || 0)) + " ₫";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📊 Báo Cáo Quản Lý</h1>

        <div className="mb-3 text-sm text-gray-600">
          <strong>Trạm dùng để lấy báo cáo:</strong>{" "}
          {managedStationId ? managedStationId : (resolvingStation ? "Đang xác định trạm..." : "Chưa xác định")}
          {(resolveError) && <span className="text-red-600"> — Lỗi: {resolveError.message}</span>}
        </div>

        {/* Bộ lọc ngày */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center gap-4">
          <label className="font-semibold text-gray-700">
            Chọn ngày:
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ml-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </label>
          <button
            onClick={async () => {
              if (!managedStationId) return alert("Chưa xác định trạm.");
              await fetchDailySummary(managedStationId);
              await fetchPeakHours(managedStationId);
            }}
            disabled={loading || !managedStationId}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            <strong>Lỗi khi tải dữ liệu:</strong> {error.message ?? String(error)}
          </div>
        )}

        {/* Tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Tổng số phiên sạc</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {displayData.dailyStats.totalSessions}
                </p>
              </div>
              <div className="text-4xl">🔌</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Tổng doanh thu</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(displayData.dailyStats.totalRevenue)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Tổng số phút sạc</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {Number(displayData.dailyStats.totalMinutes).toLocaleString()}
                </p>
              </div>
              <div className="text-4xl">⏱️</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📈 Phân bố phiên sạc giờ cao điểm
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span> Thấp / Không có
            <span className="inline-block w-3 h-3 bg-yellow-500 rounded ml-3 mr-1"></span> Trung bình
            <span className="inline-block w-3 h-3 bg-red-500 rounded ml-3 mr-1"></span> Cao đột biến
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={displayData.hourlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hour"
                label={{ value: "Giờ trong ngày", position: "insideBottom", offset: -5 }}
                tickFormatter={(hour) => `${hour}h`}
              />
              <YAxis label={{ value: "Peak Count", angle: -90, position: "insideLeft" }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const entry = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
                      <div className="text-sm font-semibold mb-1">Giờ: {entry.hour}:00</div>
                      <div className="text-sm">Peak count: {entry.peakCount}</div>
                      <div className="text-sm">Mức độ: {getIntensityLabel(entry.peakCount)}</div>
                      <div className="text-sm font-semibold" style={{color: getSmartColor(entry.peakCount)}}>
                        {entry.isPeak ? "⚠️ Giờ cao điểm" : "✓ Giờ bình thường"}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="peakCount" radius={[8, 8, 0, 0]}>
                {displayData.hourlyData.map((entry, index) => (
                  <Cell key={`cell-peak-${index}`} fill={getSmartColor(entry.peakCount)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hour table - Bảng chi tiết */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Chi tiết theo giờ</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Giờ</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Số phiên sạc</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Peak Count (API)</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Trạng thái</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Mức độ</th>
                </tr>
              </thead>
              <tbody>
                {displayData.hourlyData.map((item) => (
                  <tr 
                    key={item.hour} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${item.isPeak ? "bg-red-50" : ""}`}
                  >
                    <td className="py-3 px-4 font-medium">{item.hour}:00 - {item.hour}:59</td>
                    <td className="text-right py-3 px-4">{item.sessions}</td>
                    <td className="text-right py-3 px-4 font-semibold" style={{color: getSmartColor(item.peakCount)}}>
                      {item.peakCount}
                    </td>
                    <td className="text-center py-3 px-4">
                      {item.isPeak ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          🔥 Cao điểm
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          ✓ Bình thường
                        </span>
                      )}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: getSmartColor(item.peakCount) }}
                      >
                        {getIntensityLabel(item.peakCount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Raw peak API payload for debugging */}
    
        </div>
      </div>
    </div>
  );
}