import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'

import Dashboard from './pages/Dashboard/Dashboard.jsx'
import Stations from './pages/Stations/Stations.jsx'
import Sessions from './pages/Sessions/Sessions.jsx'
import Payments from './pages/Payments/Payments.jsx'
import Monitoring from './pages/Monitoring/Monitoring.jsx'
import Profile from './pages/Profile/Profile.jsx'
import Login from './pages/Auth/Login.jsx'

import './styles/globals.scss'

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
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
