import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'

import Dashboard from './pages/Dashboard/Dashboard.jsx'
import ScanPage from './pages/ScanPage/ScanPage.jsx'   // <-- thêm route quét QR
import Stations from './pages/Stations/Stations.jsx'
import Sessions from './pages/Sessions/Sessions.jsx'
import Payments from './pages/Payments/Payments.jsx'
import Monitoring from './pages/Monitoring/Monitoring.jsx'
import Profile from './pages/Profile/Profile.jsx'      // <-- sửa lỗi import typo
import Login from './pages/Auth/Login.jsx'

import './styles/globals.scss'

function NotFound() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2>404 — Trang không tìm thấy</h2>
      <p>Trang bạn yêu cầu không tồn tại.</p>
      <a href="/dashboard">Quay về Dashboard</a>
    </div>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const handleNavigate = () => { /* potential hook for analytics */ }

  return (
    <div className="app-root">
      <Navbar onToggle={() => setSidebarOpen(s => !s)} />
      <div className="app-body">
        <Sidebar active={sidebarOpen} onNavigate={handleNavigate} />
        <main className="main-content">
          <Routes>
            {/* public - bạn đang test giao diện nên không bảo vệ route */}
            <Route path="/login" element={<Login />} />

            {/* app routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan" element={<ScanPage />} />         {/* <-- route QR */}
            <Route path="/stations" element={<Stations />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/profile" element={<Profile />} />

            {/* root -> dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
