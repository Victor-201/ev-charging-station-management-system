import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card.jsx';
import './dashboard.scss';

export default function Dashboard() {
  const navigate = useNavigate();

  const quickCards = [
    { key: 'payments', title: 'Payments', subtitle: 'Xử lý & ghi nhận', icon: '💳', route: '/payments' },
    { key: 'stations', title: 'Stations', subtitle: 'Quản lý trạm sạc', icon: '⚡', route: '/stations' },
    { key: 'sessions', title: 'Sessions', subtitle: 'Phiên đang chạy', icon: '🔋', route: '/sessions' },
    { key: 'profile', title: 'Profile', subtitle: 'Người dùng & cấu hình', icon: '👤', route: '/profile' },
    { key: 'history', title: 'History', subtitle: 'Lịch sử sạc', icon: '📜', route: '/history' },
  ];

  return (
    <div className="page dashboard-page">
      <div className="page-inner">
        <h1>Dashboard</h1>

        <div className="actions-grid">
          {quickCards.map((c, idx) => (
            <button
              key={c.key}
              className={`action-card action-${c.key}`}
              onClick={() => navigate(c.route)}
              aria-label={c.title}
            >
              <div className="action-left">
                <div className="action-emoji" aria-hidden>{c.icon}</div>
                <div className="action-info">
                  <div className="action-title">{c.title}</div>
                  <div className="action-sub">{c.subtitle}</div>
                </div>
              </div>
              <div className="action-right">→</div>
            </button>
          ))}
        </div>

        <div className="latest-sessions" style={{ marginTop: 20 }}>
          <Card title="Latest Sessions">
            {/* giữ table nhỏ như cũ */}
            <table>
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>User</th>
                  <th>Station</th>
                  <th>Start</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>S-1001</td><td>Nguyen</td><td>Station A</td><td>10:00</td><td>Active</td></tr>
                <tr><td>S-1000</td><td>Le</td><td>Station B</td><td>09:20</td><td>Finished</td></tr>
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
