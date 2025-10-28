import React, { useMemo, useState } from 'react';
import Card from '../../components/Card.jsx';
import Table from '../../components/Table.jsx';
import './stations.scss';

const initialStations = [
  {
    id: 'ST-001',
    name: 'Station A',
    points: 4,
    status: 'online',
    address: '123 Lê Lợi, HN',
    lastUpdated: '2025-10-25 08:30',
    notes: 'Hoạt động ổn định',
    history: [
      { time: '2025-10-25 08:30', note: 'Kiểm tra định kỳ' },
      { time: '2025-09-10 10:12', note: 'Sửa cổng sạc #2' },
    ],
  },
  {
    id: 'ST-002',
    name: 'Station B',
    points: 2,
    status: 'offline',
    address: '45 Nguyễn Trãi, HCM',
    lastUpdated: '2025-10-20 14:12',
    notes: 'Mất nguồn, đang chờ kỹ thuật',
    history: [{ time: '2025-10-20 14:12', note: 'Báo lỗi mất nguồn' }],
  },
  {
    id: 'ST-003',
    name: 'Station C',
    points: 6,
    status: 'maintenance',
    address: '88 Trần Phú, ĐN',
    lastUpdated: '2025-10-18 09:00',
    notes: 'Thay module điều khiển',
    history: [{ time: '2025-10-18 09:00', note: 'Bắt đầu bảo trì' }],
  },
  // thêm station mẫu nếu cần
];

export default function Stations() {
  const [stations, setStations] = useState(initialStations);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all'|'online'|'offline'|'maintenance'

  const stats = useMemo(() => {
    const total = stations.length;
    const online = stations.filter(s => s.status === 'online').length;
    const offline = stations.filter(s => s.status === 'offline').length;
    const maintenance = stations.filter(s => s.status === 'maintenance').length;
    return { total, online, offline, maintenance };
  }, [stations]);

  const filteredByQuery = useMemo(() => {
    if (!query) return stations;
    const q = query.trim().toLowerCase();
    return stations.filter(
      s =>
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q)
    );
  }, [stations, query]);

  // apply status filter on top of query
  const filtered = useMemo(() => {
    if (statusFilter === 'all') return filteredByQuery;
    return filteredByQuery.filter(s => s.status === statusFilter);
  }, [filteredByQuery, statusFilter]);

  const selected = stations.find(s => s.id === selectedId) || null;

  function setStatus(id, newStatus) {
    setStations(prev => prev.map(s => (s.id === id ? { ...s, status: newStatus, lastUpdated: new Date().toISOString().slice(0,16).replace('T',' ') } : s)));
  }

  function addHistoryEntry(id, note) {
    setStations(prev => prev.map(s => {
      if (s.id !== id) return s;
      const entry = { time: new Date().toISOString().slice(0,16).replace('T',' '), note };
      return { ...s, history: [entry, ...(s.history || [])] };
    }));
  }

  // click stat -> set filter. clicking same active stat toggles back to 'all'
  function onClickStat(statKey) {
    setStatusFilter(prev => (prev === statKey ? 'all' : statKey));
    setSelectedId(null); // close detail when changing filter
  }

  return (
    <div className="page stations-page">
      <div className="page-inner">
        <h1>Stations</h1>

        {/* STATISTICS (clickable) */}
        <div className="stations-stats">
          <div
            className={`stat-card total ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => onClickStat('all')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClickStat('all')}
          >
            <div className="label">Tổng trạm</div>
            <div className="value">{stats.total}</div>
          </div>

          <div
            className={`stat-card online ${statusFilter === 'online' ? 'active' : ''}`}
            onClick={() => onClickStat('online')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClickStat('online')}
          >
            <div className="label">Online</div>
            <div className="value">{stats.online}</div>
          </div>

          <div
            className={`stat-card offline ${statusFilter === 'offline' ? 'active' : ''}`}
            onClick={() => onClickStat('offline')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClickStat('offline')}
          >
            <div className="label">Offline</div>
            <div className="value">{stats.offline}</div>
          </div>

          <div
            className={`stat-card maintenance ${statusFilter === 'maintenance' ? 'active' : ''}`}
            onClick={() => onClickStat('maintenance')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClickStat('maintenance')}
          >
            <div className="label">Sửa chữa</div>
            <div className="value">{stats.maintenance}</div>
          </div>

          <div className="stat-search">
            <input
              placeholder="Tìm theo ID, tên, địa chỉ..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* LAYOUT: grid of cards + detail pane */}
        <div className="stations-layout">
          {/* grid */}
          <div className={`stations-grid ${selected ? 'with-detail' : ''}`}>
            {filtered.map(st => (
              <div key={st.id} className={`station-card ${st.status}`} onClick={() => setSelectedId(st.id)}>
                <div className="card-top">
                  <div className="station-id">{st.id}</div>
                  <div className="station-status">{st.status}</div>
                </div>
                <div className="station-name">{st.name}</div>
                <div className="station-meta">
                  <span>{st.points} điểm</span>
                  <span className="dot">•</span>
                  <span className="address">{st.address}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="empty">Không tìm thấy trạm nào.</div>}
          </div>

          {/* detail pane */}
          <aside className={`stations-detail ${selected ? 'open' : ''}`} aria-hidden={!selected}>
            {!selected && (
              <Card title="Chi tiết trạm">
                <div className="empty">Chọn một trạm để xem chi tiết</div>
              </Card>
            )}

            {selected && (
              <>
                <div className="detail-header">
                  <button className="back-btn" onClick={() => setSelectedId(null)}>← Quay lại</button>
                  <h2>{selected.name} <span className={`status-badge ${selected.status}`}>{selected.status}</span></h2>
                  <div className="small-meta">ID: {selected.id} — Cập nhật: {selected.lastUpdated}</div>
                </div>

                <Card title="Thông tin">
                  <div className="info-row"><strong>Địa chỉ:</strong> {selected.address}</div>
                  <div className="info-row"><strong>Points:</strong> {selected.points}</div>
                  <div className="info-row"><strong>Ghi chú:</strong> {selected.notes}</div>

                  <div className="actions-row">
                    <button className="btn btn-primary" onClick={() => { setStatus(selected.id, 'online'); addHistoryEntry(selected.id, 'Đặt trạng thái: online'); }}>
                      Đặt Online
                    </button>
                    <button className="btn btn-warning" onClick={() => { setStatus(selected.id, 'maintenance'); addHistoryEntry(selected.id, 'Đặt trạng thái: maintenance'); }}>
                      Đặt Sửa chữa
                    </button>
                    <button className="btn btn-danger" onClick={() => { setStatus(selected.id, 'offline'); addHistoryEntry(selected.id, 'Đặt trạng thái: offline'); }}>
                      Đặt Offline
                    </button>
                  </div>
                </Card>

                <Card title="Lịch sử">
                  {selected.history && selected.history.length ? (
                    <ul className="history-list">
                      {selected.history.map((h, idx) => (
                        <li key={idx}><span className="time">{h.time}</span> — <span className="note">{h.note}</span></li>
                      ))}
                    </ul>
                  ) : <div className="empty">Không có lịch sử</div>}
                </Card>
              </>
            )}
          </aside>
        </div>

        {/* legacy: small table view (optional) */}
        <div style={{ marginTop: 18 }}>
          <Card title="Stations list (table)">
            <Table
              columns={["ID","Name","Points","Status"]}
              rows={stations.map(s => [s.id, s.name, String(s.points), s.status])}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
