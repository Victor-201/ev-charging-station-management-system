import React, { useState } from 'react';
import Card from '../../components/staff/Card/index';

export default function Settings() {
  const [settings, setSettings] = useState({
    autoUpdate: true,
    pushNotifications: false,
    emailAlerts: true,
    soundEffects: true
  });
  const [message, setMessage] = useState(null);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setMessage({ type: 'success', text: 'Cài đặt đã được lưu!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangePassword = () => {
    alert('Chức năng đổi mật khẩu sẽ được triển khai sau!');
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Cài Đặt</h1>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Cấu hình Hệ thống">
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
              <div>
                <div className="font-semibold text-gray-900">Tự động cập nhật trạng thái</div>
                <div className="text-xs text-gray-500">Cập nhật trạng thái trạm tự động mỗi 30 giây</div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.autoUpdate}
                onChange={() => handleToggle('autoUpdate')}
                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500" 
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
              <div>
                <div className="font-semibold text-gray-900">Thông báo Push</div>
                <div className="text-xs text-gray-500">Nhận thông báo về sự cố và phiên mới</div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500" 
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
              <div>
                <div className="font-semibold text-gray-900">Cảnh báo Email</div>
                <div className="text-xs text-gray-500">Gửi email khi có sự cố quan trọng</div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.emailAlerts}
                onChange={() => handleToggle('emailAlerts')}
                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500" 
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
              <div>
                <div className="font-semibold text-gray-900">Âm thanh thông báo</div>
                <div className="text-xs text-gray-500">Phát âm thanh khi có thông báo mới</div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.soundEffects}
                onChange={() => handleToggle('soundEffects')}
                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500" 
              />
            </label>

            <button 
              onClick={handleSave}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-lg mt-4"
            >
              Lưu Cài Đặt
            </button>
          </div>
        </Card>

        <Card title="Bảo mật">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-900 mb-3">
                <strong>Mật khẩu hiện tại:</strong> Được mã hóa và bảo mật
              </div>
              <div className="text-xs text-blue-700">
                Thay đổi mật khẩu định kỳ để đảm bảo bảo mật tài khoản
              </div>
            </div>

            <button 
              onClick={handleChangePassword}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition shadow-lg"
            >
              Đổi Mật Khẩu
            </button>

            <div className="pt-4 border-t">
              <div className="text-sm font-semibold text-gray-700 mb-2">Phiên đăng nhập</div>
              <div className="text-xs text-gray-500 mb-3">Đăng xuất khỏi tất cả thiết bị khác</div>
              <button className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition">
                Đăng xuất tất cả thiết bị
              </button>
            </div>
          </div>
        </Card>

        <Card title="Giao diện">
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900 mb-2">Chế độ hiển thị</div>
              <div className="grid grid-cols-2 gap-2">
                <button className="px-4 py-2 bg-white border-2 border-green-600 text-green-600 rounded-lg font-semibold">
                  ☀️ Sáng
                </button>
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
                  🌙 Tối
                </button>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900 mb-2">Ngôn ngữ</div>
              <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                <option>🇻🇳 Tiếng Việt</option>
                <option>🇬🇧 English</option>
              </select>
            </div>
          </div>
        </Card>

        <Card title="Thông tin phiên bản">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-2 border-b">
              <span className="text-gray-600">Phiên bản:</span>
              <span className="font-semibold">v1.0.0</span>
            </div>
            <div className="flex justify-between p-2 border-b">
              <span className="text-gray-600">Cập nhật lần cuối:</span>
              <span className="font-semibold">01/11/2025</span>
            </div>
            <div className="flex justify-between p-2">
              <span className="text-gray-600">Build:</span>
              <span className="font-semibold">#2025110101</span>
            </div>
            <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition mt-4">
              Kiểm tra cập nhật
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}