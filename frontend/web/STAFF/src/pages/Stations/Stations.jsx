import React, { useMemo, useState } from 'react';
import Card from '../../components/Card.jsx';
import Table from '../../components/Table.jsx';
import './stations.scss';

/*
  Thiết kế mới:
  - managedStationId: id trạm mà nhân viên hiện tại quản lý (thay giá trị nếu cần)
  - stations: vẫn giữ danh sách tất cả trạm (dùng làm mẫu), nhưng UI chỉ hiển thị trạm được gán
  - mỗi station có mảng chargers (mỗi charger = 1 trụ xạc)
  - trái: grid các charger; phải: detail pane (bao gồm info trạm + detail trụ khi chọn)
*/

const initialStations = [
  {
    id: 'ST-001',
    name: 'Station A',
    address: '123 Lê Lợi, HN',
    notes: 'Hoạt động ổn định',
    lastUpdated: '2025-10-25 08:30',
    // chargers: danh sách trụ xạc thuộc trạm này
    chargers: [
      {
        id: 'C-001',
        label: 'Trụ 1',
        type: 'AC', // optional
        status: 'available', // 'available'|'in_use'|'fault'|'charging'
        lastUpdated: '2025-10-25 08:00',
        powerPoint: 22, // kW ví dụ
        notes: 'Hoạt động bình thường',
        history: [
          { time: '2025-10-25 08:00', note: 'Kiểm tra định kỳ' },
          { time: '2025-09-20 11:10', note: 'Thay dây sạc' },
        ],
      },
      {
        id: 'C-002',
        label: 'Trụ 2',
        type: 'DC',
        status: 'in_use',
        lastUpdated: '2025-10-25 08:18',
        powerPoint: 60,
        notes: 'Đang sạc xe khách',
        history: [{ time: '2025-10-25 08:18', note: 'Bắt đầu phiên sạc' }],
      },
      {
        id: 'C-003',
        label: 'Trụ 3',
        type: 'AC',
        status: 'fault',
        lastUpdated: '2025-10-20 09:12',
        powerPoint: 11,
        notes: 'Lỗi cảm biến',
        history: [{ time: '2025-10-20 09:12', note: 'Báo lỗi cảm biến' }],
      },
    ],
    // có thể thêm fields khác nếu cần
  },
  // Các trạm khác (không hiển thị cho nhân viên này nhưng vẫn có trong "db mẫu")
  {
    id: 'ST-002',
    name: 'Station B',
    address: '45 Nguyễn Trãi, HCM',
    notes: 'Mất nguồn, đang chờ kỹ thuật',
    lastUpdated: '2025-10-20 14:12',
    chargers: [
      { id: 'C-101', label: 'Trụ 1', status: 'offline', lastUpdated: '2025-10-20 14:12', powerPoint: 22, notes: '', history: [{ time: '2025-10-20 14:12', note: 'Mất nguồn' }] },
    ],
  },
];

export default function Stations() {
  // ID trạm mà nhân viên hiện tại quản lý — thay giá trị này theo auth thực tế
  const managedStationId = 'ST-001';

  const [stations, setStations] = useState(initialStations);
  // selectedStationId giữ id trạm quản lý (thường = managedStationId)
  const [selectedStationId] = useState(managedStationId);
  // selectedChargerId: trụ xạc được chọn trong UI (null nghĩa chưa chọn)
  const [selectedChargerId, setSelectedChargerId] = useState(null);

  // filter & tìm kiếm trụ
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all|available|in_use|fault|charging

  // lấy trạm được quản lý
  const managedStation = useMemo(() => stations.find(s => s.id === selectedStationId) || null, [stations, selectedStationId]);

  // thống kê dựa trên chargers của trạm quản lý
  const stats = useMemo(() => {
    if (!managedStation) return { totalChargers: 0, available: 0, in_use: 0, fault: 0, charging: 0 };
    const totalChargers = managedStation.chargers.length;
    const available = managedStation.chargers.filter(c => c.status === 'available').length;
    const in_use = managedStation.chargers.filter(c => c.status === 'in_use').length;
    const fault = managedStation.chargers.filter(c => c.status === 'fault').length;
    const charging = managedStation.chargers.filter(c => c.status === 'charging').length;
    return { totalChargers, available, in_use, fault, charging };
  }, [managedStation]);

  // danh sách trụ đã filter theo query + status
  const filteredChargers = useMemo(() => {
    if (!managedStation) return [];
    let list = managedStation.chargers;
    if (query) {
      const q = query.trim().toLowerCase();
      list = list.filter(c => (c.id || '').toLowerCase().includes(q) || (c.label || '').toLowerCase().includes(q) || (c.notes || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    return list;
  }, [managedStation, query, statusFilter]);

  // helper: cập nhật trạng thái charger trong stations state
  function setChargerStatus(chargerId, newStatus) {
    setStations(prev => prev.map(st => {
      if (st.id !== selectedStationId) return st;
      const chargers = st.chargers.map(ch => {
        if (ch.id !== chargerId) return ch;
        const now = new Date().toISOString().slice(0,16).replace('T',' ');
        return { ...ch, status: newStatus, lastUpdated: now, history: [{ time: now, note: `Đặt trạng thái: ${newStatus}` }, ...(ch.history || [])] };
      });
      return { ...st, chargers, lastUpdated: new Date().toISOString().slice(0,16).replace('T',' ') };
    }));
  }

  // helper: thêm history cho charger
  function addChargerHistory(chargerId, note) {
    setStations(prev => prev.map(st => {
      if (st.id !== selectedStationId) return st;
      const chargers = st.chargers.map(ch => {
        if (ch.id !== chargerId) return ch;
        const now = new Date().toISOString().slice(0,16).replace('T',' ');
        return { ...ch, history: [{ time: now, note }, ...(ch.history || [])], lastUpdated: now };
      });
      return { ...st, chargers, lastUpdated: new Date().toISOString().slice(0,16).replace('T',' ') };
    }));
  }

  // click stat -> set filter. click same sẽ toggle 'all'
  function onClickStat(statKey) {
    setStatusFilter(prev => (prev === statKey ? 'all' : statKey));
    setSelectedChargerId(null);
  }

  const selectedCharger = managedStation?.chargers.find(c => c.id === selectedChargerId) || null;

  return (
    <div className="page stations-page">
      <div className="page-inner">
        <h1>Quản lý trạm — Nhân viên</h1>

        {/* STATISTICS (clickable) dựa trên chargers của trạm quản lý */}
        <div className="stations-stats">
          <div
            className={`stat-card total ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => onClickStat('all')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClickStat('all')}
          >
            <div className="label">Trạm</div>
            <div className="value">{managedStation ? managedStation.name : '—'}</div>
            <div className="sub">{managedStation ? managedStation.id : ''}</div>
          </div>

          <div
            className={`stat-card available ${statusFilter === 'available' ? 'active' : ''}`}
            onClick={() => onClickStat('available')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClickStat('available')}
          >
            <div className="label">Sẵn sàng</div>
            <div className="value">{stats.available}</div>
            <div className="sub">trụ</div>
          </div>

          <div
            className={`stat-card in_use ${statusFilter === 'in_use' ? 'active' : ''}`}
            onClick={() => onClickStat('in_use')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClickStat('in_use')}
          >
            <div className="label">Đang dùng</div>
            <div className="value">{stats.in_use}</div>
            <div className="sub">trụ</div>
          </div>

          <div
            className={`stat-card fault ${statusFilter === 'fault' ? 'active' : ''}`}
            onClick={() => onClickStat('fault')}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClickStat('fault')}
          >
            <div className="label">Lỗi</div>
            <div className="value">{stats.fault}</div>
            <div className="sub">trụ</div>
          </div>

          <div className="stat-search">
            <input
              placeholder="Tìm trụ theo ID, tên, ghi chú..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* LAYOUT: left = chargers grid, right = station detail + charger detail */}
        <div className="stations-layout">
          <div className={`stations-grid ${selectedCharger ? 'with-detail' : ''}`}>
            {managedStation ? (
              filteredChargers.map(ch => (
                <div
                  key={ch.id}
                  className={`charger-card ${ch.status} ${selectedChargerId === ch.id ? 'selected' : ''}`}
                  onClick={() => setSelectedChargerId(ch.id)}
                >
                  <div className="card-top">
                    <div className="charger-id">{ch.id}</div>
                    <div className="charger-status">{ch.status}</div>
                  </div>
                  <div className="charger-name">{ch.label}</div>
                  <div className="charger-meta">
                    <span>{ch.powerPoint} kW</span>
                    <span className="dot">•</span>
                    <span className="last-up">{ch.lastUpdated}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty">Không có trạm được gán cho nhân viên này.</div>
            )}

            {managedStation && filteredChargers.length === 0 && (
              <div className="empty">Không tìm thấy trụ nào theo bộ lọc.</div>
            )}
          </div>

          <aside className={`stations-detail ${managedStation ? 'open' : ''}`} aria-hidden={!managedStation}>
            {!managedStation && (
              <Card title="Chi tiết trạm">
                <div className="empty">Không có trạm được chọn</div>
              </Card>
            )}

            {managedStation && (
              <>
                <div className="detail-header">
                  <h2>{managedStation.name}</h2>
                  <div className="small-meta">ID: {managedStation.id} — Cập nhật: {managedStation.lastUpdated}</div>
                  <div className="station-summary">
                    <span>{stats.totalChargers} trụ</span>
                    <span className="dot">•</span>
                    <span>{stats.available} sẵn sàng</span>
                    <span className="dot">•</span>
                    <span>{stats.in_use} đang dùng</span>
                    <span className="dot">•</span>
                    <span>{stats.fault} lỗi</span>
                  </div>
                </div>

                <Card title="Thông tin trạm">
                  <div className="info-row"><strong>Địa chỉ:</strong> {managedStation.address}</div>
                  <div className="info-row"><strong>Ghi chú:</strong> {managedStation.notes}</div>
                  <div className="actions-row">
                    {/* Nút tác vụ cấp trạm (ví dụ refresh trạng thái, gọi kỹ thuật) */}
                    <button className="btn" onClick={() => {
                      // ví dụ: thêm entry lịch sử cấp trạm (không lưu riêng ở station vì chưa có field history trạm)
                      setStations(prev => prev.map(st => st.id === managedStation.id ? { ...st, lastUpdated: new Date().toISOString().slice(0,16).replace('T',' ') } : st));
                    }}>Cập nhật trạm</button>
                    <button className="btn btn-danger" onClick={() => {
                      // ví dụ: mark tất cả trụ là offline (chỉ demo)
                      setStations(prev => prev.map(st => {
                        if (st.id !== managedStation.id) return st;
                        return { ...st, chargers: st.chargers.map(ch => ({ ...ch, status: 'offline', lastUpdated: new Date().toISOString().slice(0,16).replace('T',' ') })) };
                      }));
                    }}>Mark tất cả Offline</button>
                  </div>
                </Card>

                {/* CHARGER DETAIL (nếu có) */}
                {selectedCharger ? (
                  <>
                    <Card title={`Chi tiết ${selectedCharger.label}`}>
                      <div className="info-row"><strong>ID:</strong> {selectedCharger.id}</div>
                      <div className="info-row"><strong>Loại:</strong> {selectedCharger.type || '—'}</div>
                      <div className="info-row"><strong>Công suất:</strong> {selectedCharger.powerPoint} kW</div>
                      <div className="info-row"><strong>Trạng thái:</strong> <span className={`status-badge ${selectedCharger.status}`}>{selectedCharger.status}</span></div>
                      <div className="info-row"><strong>Ghi chú:</strong> {selectedCharger.notes}</div>

                      <div className="actions-row">
                        <button className="btn btn-primary" onClick={() => { setChargerStatus(selectedCharger.id, 'available'); }}>Đặt Sẵn sàng</button>
                        <button className="btn btn-warning" onClick={() => { setChargerStatus(selectedCharger.id, 'charging'); }}>Đặt Đang sạc</button>
                        <button className="btn btn-danger" onClick={() => { setChargerStatus(selectedCharger.id, 'fault'); }}>Đặt Lỗi</button>
                        <button className="btn" onClick={() => { addChargerHistory(selectedCharger.id, 'Kiểm tra nhanh bởi kỹ thuật viên'); }}>Thêm lịch sử</button>
                      </div>
                    </Card>

                    <Card title="Lịch sử trụ">
                      {selectedCharger.history && selectedCharger.history.length ? (
                        <ul className="history-list">
                          {selectedCharger.history.map((h, idx) => <li key={idx}><span className="time">{h.time}</span> — <span className="note">{h.note}</span></li>)}
                        </ul>
                      ) : <div className="empty">Chưa có lịch sử</div>}
                    </Card>
                  </>
                ) : (
                  <Card title="Chi tiết trụ">
                    <div className="empty">Chọn một trụ để xem chi tiết</div>
                  </Card>
                )}
              </>
            )}
          </aside>
        </div>

        {/* Optional: table showing raw stations (admin view) — vẫn giữ cho debug */}
        <div style={{ marginTop: 18 }}>
          <Card title="Stations list (raw)">
            <Table
              columns={["ID","Name","#Chargers","LastUpdated"]}
              rows={stations.map(s => [s.id, s.name, String((s.chargers || []).length), s.lastUpdated || ''])}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
