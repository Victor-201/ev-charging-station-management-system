import React, { useState } from 'react';
import Card from '../../components/Card.jsx';
import './profile.scss';

export default function Profile() {
  // Dữ liệu mẫu (sau này bạn có thể lấy từ API)
  const [user] = useState({
    name: 'Phan Đình Trọng',
    phone: '0123 456 789',
    email: 'admin@example.com',
    gender: 'Nam',
    dob: '1998-05-14',
    role: 'Manager'
  });

  return (
    <div className="page profile-page">
      <h1>Thông tin cá nhân</h1>
      <Card title="Thông tin tài khoản">
        <div className="profile-info">
          <div className="profile-row">
            <span className="label">Họ và tên:</span>
            <span className="value">{user.name}</span>
          </div>
          <div className="profile-row">
            <span className="label">Số điện thoại:</span>
            <span className="value">{user.phone}</span>
          </div>
          <div className="profile-row">
            <span className="label">Email:</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="profile-row">
            <span className="label">Giới tính:</span>
            <span className="value">{user.gender}</span>
          </div>
          <div className="profile-row">
            <span className="label">Ngày sinh:</span>
            <span className="value">{user.dob}</span>
          </div>
          <div className="profile-row">
            <span className="label">Chức vụ:</span>
            <span className="value">{user.role}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
