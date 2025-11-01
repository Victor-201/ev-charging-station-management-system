import React, { useState, useMemo } from 'react';
import Card from '../../components/staff/Card/index';
import Table from '../../components/staff/Table/index';

const initialSessions = [
  ['S-1001', 'Nguyen Van A', 'Station A - Trụ 1', '10:00', 'Active', '75%', '$5.20'],
  ['S-1000', 'Le Thi B', 'Station B - Trụ 2', '09:20', 'Finished', '100%', '$12.50'],
  ['S-0999', 'Tran Van C', 'Station A - Trụ 2', '08:45', 'Active', '45%', '$3.80'],
];

export default function Sessions() {
  const [sessions, setSessions] = useState(initialSessions);
  return (
    <div className="p-8 ml-64 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Quản lý Phiên Sạc</h1>
      <Card title="Phiên đang chạy">
        <Table
          columns={['ID', 'User', 'Station', 'Start', 'Status', 'Progress', 'Cost']}
          rows={sessions}
        />
      </Card>
    </div>
  );
}