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
  ];

  // Yêu cầu quyền camera ngay khi bấm vào ô, sau đó điều hướng
  const requestCameraThenNavigate = async (to) => {
    try {
      // request quyền camera (sẽ bật prompt của trình duyệt)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // tạm dừng stream để giải phóng camera (ScanPage sẽ mở lại bằng html5-qrcode)
      stream.getTracks().forEach((t) => t.stop());
      navigate(to);
    } catch (err) {
      console.error('Camera permission denied or error:', err);
      alert('Không thể truy cập camera. Vui lòng cho phép quyền camera và thử lại.');
    }
  };

  return (
    <div className="page dashboard-page">
      <div className="page-inner">
        <h1 className="page-title">Dashboard</h1>

        {/* Ô quét mã QR ở giữa, nổi bật */}
        <div
          className="qr-scan-center"
          role="button"
          tabIndex={0}
          onClick={() => requestCameraThenNavigate('/scan')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') requestCameraThenNavigate('/scan'); }}
          aria-label="Quét mã QR để xác nhận lượt sạc"
        >
          <div className="qr-graphic">
            {/* bạn có thể thay bằng svg QR đẹp hơn */}
            <div className="qr-icon">📷</div>
          </div>
          <div className="qr-text">
            <div className="qr-title">Quét mã QR</div>
            <div className="qr-sub">Nhấn để mở camera và xác nhận lượt sạc</div>
          </div>
        </div>

        <div className="actions-grid">
          {quickCards.map((c) => (
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

        <div className="latest-sessions" style={{ marginTop: 24 }}>
          <Card title="Latest Sessions">
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
