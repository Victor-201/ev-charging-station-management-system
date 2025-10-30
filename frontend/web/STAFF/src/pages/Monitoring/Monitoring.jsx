import React, { useEffect, useMemo, useState, useRef } from 'react';
import Card from '../../components/Card.jsx';
import './monitoring.scss';

/**
 * Monitoring page (demo)
 * - Live toggle: simulate updates every X seconds
 * - Summary cards
 * - Filter & search
 * - Stations list (left) + Detail pane (right)
 *
 * Replace the mock update logic with real WebSocket / SSE / API polling as needed.
 */

const initialStations = [
  {
    id: 'ST-001',
    name: 'Station A',
    address: '123 Lê Lợi, HN',
    status: 'online', // online/offline/degraded
    chargers: [
      { id: 'C-001', label: 'Trụ 1', status: 'available' },
      { id: 'C-002', label: 'Trụ 2', status: 'in_use' },
      { id: 'C-003', label: 'Trụ 3', status: 'fault' },
    ],
    activeSessions: 1,
    energyToday: 12.6, // kWh
    lastUpdated: new Date().toISOString(),
    history: [{ time: new Date().toISOString(), note: 'Tạo trạm' }],
  },
  {
    id: 'ST-002',
    name: 'Station B',
    address: '45 Nguyễn Trãi, HCM',
    status: 'degraded',
    chargers: [
      { id: 'C-101', label: 'Trụ 1', status: 'available' },
      { id: 'C-102', label: 'Trụ 2', status: 'available' },
    ],
    activeSessions: 0,
    energyToday: 5.3,
    lastUpdated: new Date().toISOString(),
    history: [{ time: new Date().toISOString(), note: 'Reset module' }],
  },
  {
    id: 'ST-003',
    name: 'Station C',
    address: '88 Trần Phú, ĐN',
    status: 'offline',
    chargers: [
      { id: 'C-201', label: 'Trụ 1', status: 'offline' },
      { id: 'C-202', label: 'Trụ 2', status: 'offline' },
      { id: 'C-203', label: 'Trụ 3', status: 'fault' },
    ],
    activeSessions: 0,
    energyToday: 0,
    lastUpdated: new Date().toISOString(),
    history: [{ time: new Date().toISOString(), note: 'Mất nguồn' }],
  },
];

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function Monitoring() {
  const [stations, setStations] = useState(initialStations);
  const [live, setLive] = useState(true);
  const [intervalSec, setIntervalSec] = useState(5);
  const [filter, setFilter] = useState('all'); // all | online | offline | degraded
  const [query, setQuery] = useState('');
  const [selectedStationId, setSelectedStationId] = useState(null);
  const timerRef = useRef(null);

  // Derived stats
  const stats = useMemo(() => {
    const total = stations.length;
    const online = stations.filter(s => s.status === 'online').length;
    const degraded = stations.filter(s => s.status === 'degraded').length;
    const offline = stations.filter(s => s.status === 'offline').length;
    const activeSessions = stations.reduce((acc, s) => acc + (s.activeSessions || 0), 0);
    const energyToday = stations.reduce((acc, s) => acc + (s.energyToday || 0), 0);
    return { total, online, degraded, offline, activeSessions, energyToday: +energyToday.toFixed(2) };
  }, [stations]);

  // Filtering + Searching
  const visibleStations = useMemo(() => {
    let list = stations;
    if (filter !== 'all') list = list.filter(s => s.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(s => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.address || '').toLowerCase().includes(q));
    }
    return list;
  }, [stations, filter, query]);

  // select station object
  const selectedStation = useMemo(() => stations.find(s => s.id === selectedStationId) || null, [stations, selectedStationId]);

  // Simulate live updates: random changes to statuses / energy / active sessions
  useEffect(() => {
    // clear existing
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!live) return;

    timerRef.current = setInterval(() => {
      setStations(prev => prev.map(s => {
        // small random chance to change station status
        const roll = Math.random();

        // change charger statuses occasionally
        const chargers = s.chargers.map(c => {
          const r = Math.random();
          if (r > 0.94) {
            // flip a charger to random status
            c = { ...c, status: randChoice(['available', 'in_use', 'fault', 'offline']) };
          }
          return c;
        });

        // recalc activeSessions based on chargers in_use
        const inUseCount = chargers.filter(c => c.status === 'in_use').length;
        // small random bump for energy
        const extraEnergy = +(Math.random() * (inUseCount ? 0.2 : 0.05)).toFixed(3);

        // station-level status derived if many faults/offline
        const faultCount = chargers.filter(c => c.status === 'fault' || c.status === 'offline').length;
        let status = s.status;
        if (faultCount >= Math.ceil(chargers.length * 0.6)) status = 'offline';
        else if (faultCount > 0) status = 'degraded';
        else status = 'online';

        // small chance occasional major event
        if (roll > 0.995) status = randChoice(['offline', 'degraded']);

        return {
          ...s,
          chargers,
          activeSessions: inUseCount,
          energyToday: +(Math.max(0, (s.energyToday || 0) + extraEnergy)).toFixed(3),
          status,
          lastUpdated: new Date().toISOString(),
          history: [{ time: new Date().toISOString(), note: 'Auto update' }, ...(s.history || [])].slice(0, 8),
        };
      }));
    }, Math.max(1000, intervalSec * 1000));

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [live, intervalSec]);

  // Manual refresh (one-shot)
  function refreshOnce() {
    setStations(prev => prev.map(s => ({
      ...s,
      lastUpdated: new Date().toISOString(),
      history: [{ time: new Date().toISOString(), note: 'Manual refresh' }, ...(s.history || [])].slice(0, 8),
    })));
  }

  // Actions: mark station offline/online (demo)
  function setStationStatus(id, newStatus) {
    setStations(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, lastUpdated: new Date().toISOString(), history: [{ time: new Date().toISOString(), note: `Set ${newStatus}`}, ...(s.history||[])] } : s));
  }

  // Render helpers
  function statusClass(status) {
    if (status === 'online') return 'pill online';
    if (status === 'degraded') return 'pill degraded';
    return 'pill offline';
  }

  return (
    <div className="page monitoring-page">
      <div className="page-inner">
        <h1>Monitoring</h1>

        <div className="monitor-controls">
          <div className="left-controls">
            <button className={`btn ${live ? 'btn-primary' : ''}`} onClick={() => setLive(p => !p)}>{live ? 'Live: ON' : 'Live: OFF'}</button>
            <button className="btn" onClick={refreshOnce}>Refresh</button>
            <label className="small-input">
              Interval
              <select value={intervalSec} onChange={e => setIntervalSec(Number(e.target.value))}>
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
              </select>
            </label>
            <label className="small-input">
              Filter
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="online">Online</option>
                <option value="degraded">Degraded</option>
                <option value="offline">Offline</option>
              </select>
            </label>
          </div>

          <div className="right-controls">
            <input className="search" placeholder="Tìm theo id/tên/địa chỉ..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="monitor-summary" aria-hidden={false}>
          <Card>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="label">Stations</div>
                <div className="value">{stats.total}</div>
              </div>
              <div className="summary-item">
                <div className="label">Online</div>
                <div className="value">{stats.online}</div>
              </div>
              <div className="summary-item">
                <div className="label">Degraded</div>
                <div className="value">{stats.degraded}</div>
              </div>
              <div className="summary-item">
                <div className="label">Offline</div>
                <div className="value">{stats.offline}</div>
              </div>
              <div className="summary-item">
                <div className="label">Active sessions</div>
                <div className="value">{stats.activeSessions}</div>
              </div>
              <div className="summary-item">
                <div className="label">Energy (today)</div>
                <div className="value">{stats.energyToday} kWh</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="monitor-layout">
          <div className="stations-list">
            {visibleStations.length === 0 && <div className="empty">Không có trạm hiển thị.</div>}
            {visibleStations.map(s => (
              <div
                key={s.id}
                className={`station-row ${selectedStationId === s.id ? 'selected' : ''}`}
                onClick={() => setSelectedStationId(s.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedStationId(s.id); }}
              >
                <div className="row-left">
                  <div className="station-name">{s.name}</div>
                  <div className="station-id">{s.id}</div>
                  <div className={`station-status ${s.status}`}>{s.status}</div>
                </div>
                <div className="row-right">
                  <div className="meta"><strong>{s.chargers.length}</strong> trụ</div>
                  <div className="meta"><strong>{s.activeSessions}</strong> active</div>
                  <div className="meta small">• {formatTime(s.lastUpdated)}</div>
                </div>
              </div>
            ))}
          </div>

          <aside className={`monitor-detail ${selectedStation ? 'open' : ''}`} aria-hidden={!selectedStation}>
            {!selectedStation && (
              <Card title="Chi tiết trạm">
                <div className="empty">Chọn một trạm để xem chi tiết.</div>
              </Card>
            )}

            {selectedStation && (
              <>
                <div className="detail-top">
                  <h2>{selectedStation.name}</h2>
                  <div className={`status ${selectedStation.status}`}>{selectedStation.status}</div>
                  <div className="small-meta">ID: {selectedStation.id} — {selectedStation.address}</div>
                </div>

                <Card title="Thông tin chung">
                  <div className="info-row"><strong>Trụ:</strong> {selectedStation.chargers.length}</div>
                  <div className="info-row"><strong>Active sessions:</strong> {selectedStation.activeSessions}</div>
                  <div className="info-row"><strong>Energy today:</strong> {selectedStation.energyToday} kWh</div>

                  <div className="actions-row">
                    <button className="btn" onClick={() => setStationStatus(selectedStation.id, 'online')}>Set Online</button>
                    <button className="btn" onClick={() => setStationStatus(selectedStation.id, 'degraded')}>Set Degraded</button>
                    <button className="btn danger" onClick={() => setStationStatus(selectedStation.id, 'offline')}>Set Offline</button>
                  </div>
                </Card>

                <Card title="Trụ xạc">
                  <div className="charger-grid">
                    {selectedStation.chargers.map(c => (
                      <div key={c.id} className={`charger-tile ${c.status}`}>
                        <div className="ct-top">
                          <div className="ct-label">{c.label}</div>
                          <div className="ct-id">{c.id}</div>
                        </div>
                        <div className="ct-status">{c.status}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Lịch sử gần đây">
                  <ul className="history-list">
                    {selectedStation.history.slice(0, 8).map((h, i) => (
                      <li key={i}><span className="time">{formatTime(h.time)}</span> — <span className="note">{h.note}</span></li>
                    ))}
                  </ul>
                </Card>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
