import React, { useState } from 'react';
import Card from '../../components/Card.jsx';
import './sessions.scss';

/* sample managed station with chargers (nhân viên được gán trạm này) */
const managedStation = {
  id: 'ST-001',
  name: 'Station A',
  chargers: [
    { id: 'C-001', label: 'Trụ 1', status: 'available', powerKw: 22 },
    { id: 'C-002', label: 'Trụ 2', status: 'in_use', powerKw: 60 },
    { id: 'C-003', label: 'Trụ 3', status: 'available', powerKw: 11 },
    { id: 'C-004', label: 'Trụ 4', status: 'fault', powerKw: 22 },
  ],
};

const sampleSessions = [
  {
    id: 'S100',
    user: 'Pham',
    station: managedStation.id,
    charger: 'C-002',
    start: '2025-10-30T08:00:00',
    end: null,
    energy: 0,
    powerKw: 60,
    status: 'active',
    lastUpdated: '2025-10-30T08:00:00',
  },
];

function formatShort(dtIso) {
  if (!dtIso) return '—';
  const d = new Date(dtIso);
  return d.toLocaleString();
}

function estimateEnergy(startIso, endIso, powerKw = 22) {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
  return +(hours * powerKw).toFixed(2);
}

export default function Sessions() {
  const [sessions, setSessions] = useState(sampleSessions);
  const [chargers, setChargers] = useState(managedStation.chargers);

  // modal state
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedChargerForStart, setSelectedChargerForStart] = useState(null);

  // Toggle Pause / Resume
  function togglePause(sessionId) {
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sessionId) return s;
        if (s.status === 'finished') return s;
        if (s.status === 'active') {
          return { ...s, status: 'paused', lastUpdated: new Date().toISOString(), pausedAt: new Date().toISOString() };
        } else if (s.status === 'paused') {
          const { pausedAt, ...rest } = s;
          return { ...rest, status: 'active', lastUpdated: new Date().toISOString() };
        }
        return s;
      })
    );
  }

  // End session: confirm + compute energy, mark finished, free charger (set available)
  function endSession(sessionId) {
    const yes = window.confirm('Bạn có chắc muốn kết thúc phiên này không?');
    if (!yes) return;

    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sessionId) return s;
        if (s.status === 'finished') return s;
        const endIso = new Date().toISOString();
        const energy = estimateEnergy(s.start, endIso, s.powerKw);
        // free the charger locally
        if (s.charger) {
          setChargers(prevC => prevC.map(c => (c.id === s.charger ? { ...c, status: 'available' } : c)));
        }
        return { ...s, status: 'finished', end: endIso, energy, lastUpdated: endIso };
      })
    );
  }

  // Start session flow
  function openStartModal() {
    setSelectedChargerForStart(null);
    setShowStartModal(true);
  }

  function cancelStart() {
    setSelectedChargerForStart(null);
    setShowStartModal(false);
  }

  function confirmStart() {
    if (!selectedChargerForStart) {
      alert('Vui lòng chọn một trụ để bắt đầu.');
      return;
    }

    // ensure chosen charger is still available (race-safe)
    const chosenNow = chargers.find(c => c.id === selectedChargerForStart);
    if (!chosenNow || chosenNow.status !== 'available') {
      alert('Trụ đã không còn sẵn sàng. Vui lòng chọn trụ khác.');
      // refresh selection
      setSelectedChargerForStart(null);
      return;
    }

    // mark charger as in_use
    setChargers(prev => prev.map(c => (c.id === selectedChargerForStart ? { ...c, status: 'in_use' } : c)));

    // create session
    const id = `S${Math.floor(Math.random() * 900 + 100)}`;
    const now = new Date().toISOString();
    const chosen = chargers.find(c => c.id === selectedChargerForStart) || {};
    const newSession = {
      id,
      user: 'CurrentUser', // thay bằng auth user thực tế
      station: managedStation.id,
      charger: chosen.id,
      start: now,
      end: null,
      energy: 0,
      powerKw: chosen.powerKw || 22,
      status: 'active',
      lastUpdated: now,
    };

    setSessions(prev => [newSession, ...prev]);
    setShowStartModal(false);
    setSelectedChargerForStart(null);
  }

  // helper to update a charger status locally
  function setChargerStatusLocal(chargerId, newStatus) {
    setChargers(prev => prev.map(c => (c.id === chargerId ? { ...c, status: newStatus } : c)));
  }

  // New: safer select handler (prevents selection if charger not available)
  function handleSelectCharger(chargerId) {
    const ch = chargers.find(c => c.id === chargerId);
    if (!ch) return;
    if (ch.status !== 'available') {
      // keep user informed; do NOT set as selected
      // you can replace alert with a nicer UI toast
      alert(`Trụ ${ch.id} hiện không thể chọn (status: ${ch.status}).`);
      return;
    }
    setSelectedChargerForStart(prev => (prev === chargerId ? null : chargerId));
  }

  // keyboard handler for charger clickability
  function handleChargerKey(e, chargerId) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectCharger(chargerId);
    }
  }

  return (
    <div className="page sessions-page">
      <div className="page-inner">
        <h1>Sessions</h1>

        <Card title="Session history">
          <div className="sessions-header">
            <div className="station-info">Trạm: {managedStation.name} ({managedStation.id})</div>

            <div className="session-actions">
              <button className="btn btn-primary" onClick={openStartModal}>Bắt đầu session</button>
              <button
                className="btn"
                onClick={() => {
                  const firstAv = chargers.find(c => c.status === 'available');
                  if (firstAv) setChargerStatusLocal(firstAv.id, 'fault');
                }}
              >
              </button>
            </div>
          </div>

          <div className="sessions-table-wrap">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Station / Charger</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Energy (kWh)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} className={`session-row ${s.status}`}>
                    <td>{s.id}</td>
                    <td>{s.user}</td>
                    <td>{s.station} {s.charger ? <span className="muted">/ {s.charger}</span> : null}</td>
                    <td>{formatShort(s.start)}</td>
                    <td>{s.end ? formatShort(s.end) : '—'}</td>
                    <td>{s.energy ? `${s.energy} kWh` : (s.status === 'finished' ? '0 kWh' : '—')}</td>
                    <td><span className={`status-pill ${s.status}`}>{s.status}</span></td>
                    <td className="actions-cell">
                      <button className="btn btn-small" onClick={() => togglePause(s.id)} disabled={s.status === 'finished'}>
                        {s.status === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
                      </button>
                      <button className="btn btn-small danger" onClick={() => endSession(s.id)} disabled={s.status === 'finished'}>
                        Kết thúc
                      </button>
                    </td>
                  </tr>
                ))}

                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="8" className="no-sessions">Không có phiên nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* START SESSION MODAL (no inline CSS) */}
        {showStartModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Chọn trụ để bắt đầu session">
            <div className="modal" role="document">
              <div className="modal-header">
                <h3>Chọn trụ để bắt đầu</h3>
                <p className="modal-sub">Chỉ hiển thị các trụ thuộc trạm bạn được gán.</p>
              </div>

              <div className="modal-chargers">
                {chargers.map(c => {
                  const disabled = c.status !== 'available';
                  const isSelected = selectedChargerForStart === c.id;
                  return (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      onClick={() => handleSelectCharger(c.id)}
                      onKeyDown={(e) => handleChargerKey(e, c.id)}
                      className={`charger-select ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                      aria-pressed={isSelected}
                      aria-disabled={disabled}
                    >
                      <div className="charger-meta-left">
                        <div className="charger-title">
                          <span className="charger-label">{c.label}</span>
                          <span className="charger-id muted">{c.id}</span>
                        </div>
                        <div className="charger-sub muted">{c.powerKw} kW — {c.status}</div>
                      </div>

                      <div className="charger-meta-right">
                        {disabled ? <span className="charger-disabled">Không thể chọn</span> : <span className="charger-choose">{isSelected ? 'Đã chọn' : 'Chọn'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions">
                <button className="btn" onClick={cancelStart}>Hủy</button>
                <button className="btn btn-primary" onClick={confirmStart} disabled={!selectedChargerForStart}>Bắt đầu</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
