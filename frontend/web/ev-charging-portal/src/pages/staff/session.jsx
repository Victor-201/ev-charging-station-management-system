import React, { useState, useEffect } from 'react';
import { useChargingControl } from '@/hooks/useChargingControl';
import { Battery, Zap, Pause, Play, Square, RefreshCw, AlertCircle, Clock, DollarSign } from 'lucide-react';

const STATION_ID = '22222222-2222-2222-2222-222222222222';

const SessionManager = () => {
  const {
    activePoints,
    sessions,
    currentSession,
    telemetry,
    sessionEvents,
    invoice,
    loadingSession,
    loadingTelemetry,
    loadingInvoice,
    error,
    getActivePointsByStation,
    getSessionById,
    getTelemetry,
    getSessionEvents,
    pauseSession,
    resumeSession,
    stopSession,
    getInvoiceBySession,
    reconcileSession,
    clearError,
    refreshSession,
  } = useChargingControl();

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileData, setReconcileData] = useState({
    energy_kwh: '',
    cost: '',
    reason: ''
  });

  // Load active points khi component mount
  useEffect(() => {
    loadActivePoints();
  }, []);

  // Auto refresh telemetry mỗi 5s nếu có session đang active
  useEffect(() => {
    if (!autoRefresh || !selectedSessionId) return;

    const interval = setInterval(() => {
      if (currentSession?.status === 'active' || currentSession?.status === 'charging') {
        getTelemetry(selectedSessionId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedSessionId, currentSession?.status]);

  const loadActivePoints = async () => {
    await getActivePointsByStation(STATION_ID);
  };

  const handleSelectSession = async (sessionId) => {
    setSelectedSessionId(sessionId);
    const result = await getSessionById(sessionId);
    if (result.success) {
      await getTelemetry(sessionId);
      await getSessionEvents(sessionId);
    }
  };

  const handlePause = async () => {
    if (!selectedSessionId) return;
    const result = await pauseSession(selectedSessionId);
    if (result.success) {
      await refreshSession(selectedSessionId);
    }
  };

  const handleResume = async () => {
    if (!selectedSessionId) return;
    const result = await resumeSession(selectedSessionId);
    if (result.success) {
      await refreshSession(selectedSessionId);
    }
  };

  const handleStop = async () => {
    if (!selectedSessionId) return;
    if (!confirm('Bạn có chắc muốn dừng phiên sạc này?')) return;
    
    const result = await stopSession({ session_id: selectedSessionId });
    if (result.success) {
      await getInvoiceBySession(selectedSessionId);
      await loadActivePoints();
    }
  };

  const handleReconcile = async () => {
    if (!selectedSessionId) return;
    const payload = {
      energy_kwh: parseFloat(reconcileData.energy_kwh) || undefined,
      cost: parseFloat(reconcileData.cost) || undefined,
      reason: reconcileData.reason
    };
    
    const result = await reconcileSession(selectedSessionId, payload);
    if (result.success) {
      setShowReconcileModal(false);
      setReconcileData({ energy_kwh: '', cost: '', reason: '' });
      await refreshSession(selectedSessionId);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      charging: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      stopped: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800',
      error: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="text-blue-600" size={32} />
                Quản Lý Phiên Sạc
              </h1>
              <p className="text-gray-600 mt-1">Trạm: {STATION_ID}</p>
            </div>
            <button
              onClick={loadActivePoints}
              disabled={loadingSession}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={18} className={loadingSession ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Lỗi</p>
              <p className="text-red-700 text-sm">{error.message || 'Đã xảy ra lỗi'}</p>
            </div>
            <button onClick={clearError} className="text-red-600 hover:text-red-800">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Points List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Điểm Sạc Hoạt Động ({Array.isArray(activePoints) ? activePoints.length : 0})
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
  {Array.isArray(activePoints?.active) && activePoints.active.map((point, index) => (
    <div
      key={point.session_id || point.id || `point-${index}`}
      onClick={() => handleSelectSession(point.session_id || point.id)}
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
        selectedSessionId === (point.session_id || point.id)
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-900">
          Cổng {point.connector_id || point.point_id}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(point.status)}`}>
          {point.status}
        </span>
      </div>
      <p className="text-sm text-gray-600">User: {point.user_id || 'N/A'}</p>
      <p className="text-sm text-gray-600">
        {point.energy_kwh ? `${point.energy_kwh.toFixed(2)} kWh` : '0 kWh'}
      </p>
    </div>
  ))}
  {(!Array.isArray(activePoints?.active) || activePoints.active.length === 0) && (
    <p className="text-center text-gray-500 py-8">Không có phiên sạc nào đang hoạt động</p>
  )}
</div>

            </div>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedSessionId ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Battery size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Chọn một phiên sạc để xem chi tiết</p>
              </div>
            ) : (
              <>
                {/* Session Info & Controls */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Chi Tiết Phiên Sạc</h2>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                          className="rounded"
                        />
                        Auto refresh
                      </label>
                    </div>
                  </div>

                  {currentSession && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Session ID</p>
                          <p className="font-mono text-sm">{currentSession.session_id || currentSession.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Trạng thái</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSession.status)}`}>
                            {currentSession.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">User ID</p>
                          <p className="font-medium">{currentSession.user_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Connector</p>
                          <p className="font-medium">{currentSession.connector_id || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
                        {(currentSession.status === 'active' || currentSession.status === 'charging') && (
                          <button
                            onClick={handlePause}
                            disabled={loadingSession}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                          >
                            <Pause size={18} />
                            Tạm dừng
                          </button>
                        )}
                        {currentSession.status === 'paused' && (
                          <button
                            onClick={handleResume}
                            disabled={loadingSession}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            <Play size={18} />
                            Tiếp tục
                          </button>
                        )}
                        {(currentSession.status === 'active' || currentSession.status === 'charging' || currentSession.status === 'paused') && (
                          <button
                            onClick={handleStop}
                            disabled={loadingSession}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            <Square size={18} />
                            Dừng sạc
                          </button>
                        )}
                        {(currentSession.status === 'stopped' || currentSession.status === 'completed') && (
                          <button
                            onClick={() => getInvoiceBySession(selectedSessionId)}
                            disabled={loadingInvoice}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            <DollarSign size={18} />
                            Xem hóa đơn
                          </button>
                        )}
                        <button
                          onClick={() => setShowReconcileModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Điều chỉnh
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Telemetry */}
                {telemetry && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thông Số Thời Gian Thực</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 mb-1">Năng lượng</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {telemetry.energy_kwh?.toFixed(2) || '0.00'} <span className="text-sm">kWh</span>
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 mb-1">Công suất</p>
                        <p className="text-2xl font-bold text-green-900">
                          {telemetry.power_kw?.toFixed(1) || '0.0'} <span className="text-sm">kW</span>
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 mb-1">Dòng điện</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {telemetry.current_a?.toFixed(1) || '0.0'} <span className="text-sm">A</span>
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600 mb-1">Điện áp</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {telemetry.voltage_v?.toFixed(0) || '0'} <span className="text-sm">V</span>
                        </p>
                      </div>
                    </div>
                    {telemetry.soc && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Mức pin (SoC)</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                              className="bg-green-500 h-full transition-all duration-500"
                              style={{ width: `${telemetry.soc}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900">{telemetry.soc}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Invoice */}
                {invoice && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign size={20} />
                      Hóa Đơn
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Năng lượng tiêu thụ</span>
                        <span className="font-semibold">{invoice.energy_kwh?.toFixed(2)} kWh</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Đơn giá</span>
                        <span className="font-semibold">{invoice.rate || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Thời gian sạc</span>
                        <span className="font-semibold">{invoice.duration || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg">
                        <span className="font-bold text-lg">Tổng tiền</span>
                        <span className="font-bold text-lg text-blue-600">
                          {invoice.total_cost?.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Events Log */}
                {Array.isArray(sessionEvents) && sessionEvents.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock size={20} />
                      Lịch Sử Sự Kiện
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sessionEvents.map((event, idx) => (
                        <div key={`event-${idx}-${event.id || ''}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{event.event_type || event.type}</p>
                            <p className="text-sm text-gray-600">{event.description || event.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(event.timestamp || event.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reconcile Modal */}
        {showReconcileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Điều Chỉnh Phiên Sạc</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Năng lượng (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={reconcileData.energy_kwh}
                    onChange={(e) => setReconcileData({...reconcileData, energy_kwh: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập năng lượng mới"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi phí (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={reconcileData.cost}
                    onChange={(e) => setReconcileData({...reconcileData, cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập chi phí mới"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do điều chỉnh
                  </label>
                  <textarea
                    value={reconcileData.reason}
                    onChange={(e) => setReconcileData({...reconcileData, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Mô tả lý do điều chỉnh..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowReconcileModal(false);
                    setReconcileData({ energy_kwh: '', cost: '', reason: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReconcile}
                  disabled={loadingSession}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManager;