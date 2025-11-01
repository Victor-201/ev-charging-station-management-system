import React, { useState } from 'react';
import Card from '../../components/staff/Card/index';

export default function IncidentReport() {
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({ station: '', issue: '', description: '' });

  const submitReport = () => {
    if (!form.station || !form.issue) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setReports([...reports, { ...form, id: Date.now(), time: new Date().toLocaleString() }]);
    setForm({ station: '', issue: '', description: '' });
  };

  return (
    <div className="p-8 ml-64 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Báo cáo Sự Cố</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Tạo báo cáo mới">
          <div className="space-y-4">
            <input placeholder="Trạm (VD: Station A)" value={form.station} onChange={(e) => setForm({...form, station: e.target.value})} className="w-full p-3 border rounded-lg" />
            <select value={form.issue} onChange={(e) => setForm({...form, issue: e.target.value})} className="w-full p-3 border rounded-lg">
              <option>Chọn vấn đề</option>
              <option>Lỗi sạc</option>
              <option>Mất điện</option>
              <option>Khác</option>
            </select>
            <textarea placeholder="Mô tả chi tiết" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full p-3 border rounded-lg h-32" />
            <button onClick={submitReport} className="w-full bg-red-500 text-white py-3 rounded-lg font-bold">Gửi Báo Cáo</button>
          </div>
        </Card>
        <Card title="Lịch sử báo cáo">
          {reports.length ? (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li key={r.id} className="p-3 bg-red-50 rounded-lg">
                  <strong>{r.station}</strong> - {r.issue}<br />
                  <small>{r.time}</small>
                </li>
              ))}
            </ul>
          ) : <p className="text-gray-500">Chưa có báo cáo</p>}
        </Card>
      </div>
    </div>
  );
}