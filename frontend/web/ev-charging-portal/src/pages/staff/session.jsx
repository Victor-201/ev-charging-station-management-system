// src/pages/staff/Sessions.jsx
import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import Card from "@/components/staff/Card";
import Table from "@/components/staff/Table";
import { StationContext } from "@/contexts/StationContext";
import { ChargingControlContext } from "@/contexts/ChargingControlContext";

export default function Sessions() {
  const {
    stations,
    currentStation,
    setCurrentStation,
    getAll: fetchStations,
    getConnectors,
    connectors,
  } = useContext(StationContext);

  const {
    sessions,
    fetchSessionsByStation,
    pauseSession,
    resumeSession,
    stopSession,
    loadingSession,
    setSessions, // optional setter if you added it
  } = useContext(ChargingControlContext);

  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // load stations on mount (if not loaded)
  useEffect(() => {
    if (!stations || stations.length === 0) {
      fetchStations().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when station selected, load connectors and sessions
  const loadForStation = useCallback(async (station) => {
    if (!station) return;
    setLocalLoading(true);
    setError(null);
    try {
      // optional: load connectors (for display)
      await getConnectors(station.station_id || station.id);
      // Try aggregator
      const r = await fetchSessionsByStation(station.station_id || station.id, { status: "charging,paused" });
      if (!r.success) {
        // fallback: if aggregator absent, you could fetch per-connector (not implemented here)
        setError("Không thể load sessions (fallback required).");
      }
    } catch (err) {
      setError(err?.message || "Error loading station data");
    } finally {
      setLocalLoading(false);
    }
  }, [getConnectors, fetchSessionsByStation]);

  // effect: when currentStation changes, load its sessions
  useEffect(() => {
    if (currentStation) {
      loadForStation(currentStation);
      // start polling
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        fetchSessionsByStation(currentStation.station_id || currentStation.id, { status: "charging,paused" }).catch(()=>{});
      }, 5000); // every 5s
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [currentStation, loadForStation, fetchSessionsByStation]);

  // simple table rows mapping - adjust fields to your session shape
  const rows = (sessions || []).map((s) => {
    // expected session fields from aggregator (adjust if different)
    const id = s.session_id ?? s.id;
    const user = s.user_id ?? (s.user?.name) ?? "Unknown";
    const stationName = currentStation?.name ?? (s.station_name ?? "Unknown");
    const point = s.point_id ?? s.connector_id ?? s.point ?? "—";
    const start = s.started_at ? new Date(s.started_at).toLocaleTimeString() : "-";
    const status = s.status ?? "-";
    const progress = s.kwh ? `${Number(s.kwh).toFixed(3)} kWh` : (s.progress ?? "-");
    const cost = s.cost ? `${s.cost}` : "-";

    // actions column will be rendered as button labels in a single cell (Table may need customization)
    return [
      id,
      user,
      `${stationName} - ${point}`,
      start,
      status,
      progress,
      cost,
      id, // keep id in hidden column for action handlers if needed
    ];
  });

  // action handlers
  const handlePause = async (session_id) => {
    if (!confirm(`Tạm dừng phiên ${session_id}?`)) return;
    try {
      const r = await pauseSession(session_id);
      if (r.success) {
        // optimistic update: update sessions in context
        setSessions?.((prev) => prev?.map(s => (s.session_id === session_id || s.id === session_id ? r.data : s)) ?? prev);
      } else {
        alert("Pause failed");
      }
    } catch (err) {
      alert(err?.message || "Pause error");
    }
  };

  const handleResume = async (session_id) => {
    try {
      const r = await resumeSession(session_id);
      if (r.success) {
        setSessions?.((prev) => prev?.map(s => (s.session_id === session_id || s.id === session_id ? r.data : s)) ?? prev);
      } else {
        alert("Resume failed");
      }
    } catch (err) {
      alert(err?.message || "Resume error");
    }
  };

  const handleStop = async (session_id) => {
    if (!confirm(`Kết thúc phiên ${session_id} ngay?`)) return;
    try {
      // stopSession takes payload in your provider; adjust if signature differs
      const r = await stopSession({ session_id });
      if (r.success) {
        // remove or update the session
        setSessions?.((prev) => prev?.filter(s => !(s.session_id === session_id || s.id === session_id)) ?? prev);
      } else {
        alert("Stop failed");
      }
    } catch (err) {
      alert(err?.message || "Stop error");
    }
  };

  // Render table with custom actions column (if your Table supports render function, else create custom cell)
  // I'll render a simple custom table if your Table component cannot accept a render function.
  return (
    <div className="p-8 ml-64 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Quản lý Phiên Sạc</h1>

      <div className="mb-4 flex items-center gap-4">
        <label className="font-medium">Chọn Station:</label>
        <select
          value={currentStation?.station_id ?? ""}
          onChange={(e) => {
            const sel = stations?.find(s => (s.station_id ?? s.id) === e.target.value);
            setCurrentStation(sel || null);
          }}
          className="border p-2 rounded"
        >
          <option value="">-- Chọn station --</option>
          {stations?.map((st) => (
            <option key={st.station_id ?? st.id} value={st.station_id ?? st.id}>
              {st.name ?? st.station_id ?? st.id}
            </option>
          ))}
        </select>

        <button
          onClick={() => currentStation && loadForStation(currentStation)}
          className="ml-2 px-3 py-1 bg-sky-500 text-white rounded"
        >
          Refresh
        </button>

        {localLoading || loadingSession ? <span className="ml-4">Loading...</span> : null}
      </div>

      <Card title={`Phiên (Station: ${currentStation?.name ?? "—"})`}>
        <div className="overflow-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Station - Point</th>
                <th className="px-4 py-2 text-left">Start</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Energy</th>
                <th className="px-4 py-2 text-left">Cost</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(sessions && sessions.length > 0) ? sessions.map((s) => {
                const id = s.session_id ?? s.id;
                const user = s.user_id ?? s.user?.name ?? "Unknown";
                const point = s.point_id ?? s.connector_id ?? "—";
                const start = s.started_at ? new Date(s.started_at).toLocaleTimeString() : "-";
                const status = s.status ?? "-";
                const energy = s.kwh ? `${Number(s.kwh).toFixed(3)} kWh` : "-";
                const cost = s.cost ? `${s.cost}` : "-";

                return (
                  <tr key={id} className="border-t">
                    <td className="px-4 py-2">{id}</td>
                    <td className="px-4 py-2">{user}</td>
                    <td className="px-4 py-2">{`${currentStation?.name ?? ""} - ${point}`}</td>
                    <td className="px-4 py-2">{start}</td>
                    <td className="px-4 py-2">{status}</td>
                    <td className="px-4 py-2">{energy}</td>
                    <td className="px-4 py-2">{cost}</td>
                    <td className="px-4 py-2 flex gap-2">
                      {status === "charging" && (
                        <>
                          <button onClick={() => handlePause(id)} className="px-2 py-1 bg-yellow-400 rounded">Pause</button>
                          <button onClick={() => handleStop(id)} className="px-2 py-1 bg-red-500 text-white rounded">Stop</button>
                        </>
                      )}
                      {status === "paused" && (
                        <>
                          <button onClick={() => handleResume(id)} className="px-2 py-1 bg-green-500 text-white rounded">Resume</button>
                          <button onClick={() => handleStop(id)} className="px-2 py-1 bg-red-500 text-white rounded">Stop</button>
                        </>
                      )}
                      {status === "finished" && <span className="text-gray-500">Finished</span>}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    Không có phiên sạc nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {error && <div className="text-red-500 mt-4">{String(error)}</div>}
    </div>
  );
}
