import React, { useState, useEffect } from 'react';
import { useChargingControl } from '@/hooks/useChargingControl';
import { Battery, Zap, Pause, Play, Square, RefreshCw, AlertCircle, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATION_ID = '22222222-2222-2222-2222-222222222222';

const SessionManager = () => {
  const navigate = useNavigate();
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
  const [reconcileResult, setReconcileResult] = useState(null);
  const [loadingReconcile, setLoadingReconcile] = useState(false);

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select' | 'processing'
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [walletPolling, setWalletPolling] = useState(false);
  const [cashConfirmed, setCashConfirmed] = useState(false);

  useEffect(() => {
    loadActivePoints();
  }, []);

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
    if (result?.success) {
      await getTelemetry(sessionId);
      await getSessionEvents(sessionId);
      setReconcileResult(null);
    }
  };

  const handlePause = async () => {
    if (!selectedSessionId) return;
    const result = await pauseSession(selectedSessionId);
    if (result?.success) await refreshSession(selectedSessionId);
  };

  const handleResume = async () => {
    if (!selectedSessionId) return;
    const result = await resumeSession(selectedSessionId);
    if (result?.success) await refreshSession(selectedSessionId);
  };

  const handleStop = async () => {
    if (!selectedSessionId) return;
    if (!confirm('Bạn có chắc muốn dừng phiên sạc này?')) return;
    const result = await stopSession({ session_id: selectedSessionId });
    if (result?.success) {
      await getInvoiceBySession(selectedSessionId);
      await loadActivePoints();
      
      const hasReservation = currentSession?.reservation_id != null && currentSession?.reservation_id !== '';
      
      try {
        setLoadingReconcile(true);
        if (hasReservation) {
          const rec = await reconcileSession(selectedSessionId, {});
          const data = rec?.data ?? rec;
          const payload = data?.result ?? data;
          if (payload && (payload.reservation_id || payload.reserved !== undefined || payload.actual !== undefined)) {
            setReconcileResult(payload);
          } else {
            setReconcileResult(null);
          }
        } else {
          const invoiceResult = await getInvoiceBySession(selectedSessionId);
          const invoiceData = invoiceResult?.data ?? invoiceResult;
          const finalCost = invoiceData?.total_cost ?? invoiceData?.cost ?? result.data?.cost ?? 0;
          
          setReconcileResult({
            reservation_id: null,
            reserved: 0,
            actual: finalCost,
            diff: finalCost,
            action: finalCost > 0 ? 'charge' : 'none',
            payment_status: 'pending',
            autoSettled: false,
            note: 'Phiên không có đặt trước - thanh toán toàn bộ'
          });
        }
      } catch (e) {
        setReconcileResult(null);
      } finally {
        setLoadingReconcile(false);
      }
    }
  };

  const handleReconcile = async () => {
    if (!selectedSessionId) return;
    
    const hasReservation = currentSession?.reservation_id != null && currentSession?.reservation_id !== '';
    
    if (!hasReservation) {
      setLoadingReconcile(true);
      try {
        const invoiceResult = await getInvoiceBySession(selectedSessionId);
        const invoiceData = invoiceResult?.data ?? invoiceResult;
        const finalCost = invoiceData?.total_cost ?? invoiceData?.cost ?? currentSession?.cost ?? 0;
        
        setReconcileResult({
          reservation_id: null,
          reserved: 0,
          actual: finalCost,
          diff: finalCost,
          action: finalCost > 0 ? 'charge' : 'none',
          payment_status: 'pending',
          autoSettled: false,
          note: 'Phiên không có đặt trước - thanh toán toàn bộ'
        });
      } catch (e) {
        console.error('Error getting invoice:', e);
      } finally {
        setLoadingReconcile(false);
      }
      return;
    }
    
    setLoadingReconcile(true);
    const result = await reconcileSession(selectedSessionId, {});
    setLoadingReconcile(false);
    if (result?.success) {
      const data = result.data ?? result;
      const payloadResp = data?.result ?? data;
      setReconcileResult(payloadResp ?? null);
      await refreshSession(selectedSessionId);
    }
  };

  const handleRefreshReconcile = async () => {
    if (!selectedSessionId) return;
    
    const hasReservation = currentSession?.reservation_id != null && currentSession?.reservation_id !== '';
    
    try {
      setLoadingReconcile(true);
      if (hasReservation) {
        const rec = await reconcileSession(selectedSessionId, {});
        const data = rec?.data ?? rec;
        const payload = data?.result ?? data;
        setReconcileResult(payload ?? null);
      } else {
        const invoiceResult = await getInvoiceBySession(selectedSessionId);
        const invoiceData = invoiceResult?.data ?? invoiceResult;
        const finalCost = invoiceData?.total_cost ?? invoiceData?.cost ?? currentSession?.cost ?? 0;
        
        setReconcileResult({
          reservation_id: null,
          reserved: 0,
          actual: finalCost,
          diff: finalCost,
          action: finalCost > 0 ? 'charge' : 'none',
          payment_status: reconcileResult?.payment_status || 'pending',
          autoSettled: false,
          note: 'Phiên không có đặt trước - thanh toán toàn bộ'
        });
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingReconcile(false);
    }
  };

  const handleOpenPaymentModal = () => {
    if (!reconcileResult || reconcileResult.payment_status !== 'pending') return;
    setSelectedPaymentMethod(null);
    setPaymentStep('select');
    setQrCodeUrl(null);
    setWalletPolling(false);
    setCashConfirmed(false);
    setShowPaymentModal(true);
  };

  const handleSelectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleProceedPayment = async () => {
    if (!selectedPaymentMethod) return;
    
    setPaymentStep('processing');

    if (selectedPaymentMethod === 'bank') {
      // Giả lập tạo QR code (thay bằng API thực tế)
      setTimeout(() => {
        const mockQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PAY:${selectedSessionId}:${reconcileResult.diff}`;
        setQrCodeUrl(mockQR);
      }, 1000);
    } else if (selectedPaymentMethod === 'wallet') {
      // Bắt đầu polling để check trạng thái thanh toán từ ví
      setWalletPolling(true);
      pollWalletPayment();
    }
    // Cash không cần xử lý gì, chỉ chờ xác nhận
  };

  const pollWalletPayment = () => {
    // Giả lập polling API để check thanh toán ví
    // Trong thực tế: gọi API check payment status mỗi 2-3 giây
    const interval = setInterval(async () => {
      // Mock: sau 5 giây thì thành công
      // Thực tế: gọi API checkPaymentStatus(sessionId)
      const paymentSuccess = Math.random() > 0.7; // giả lập
      
      if (paymentSuccess) {
        clearInterval(interval);
        setWalletPolling(false);
        // Cập nhật trạng thái thanh toán
        setReconcileResult(prev => ({...prev, payment_status: 'completed'}));
        alert('Thanh toán ví thành công!');
        setShowPaymentModal(false);
      }
    }, 3000);

    // Timeout sau 60 giây
    setTimeout(() => {
      clearInterval(interval);
      setWalletPolling(false);
    }, 60000);
  };

  const handleConfirmCashPayment = async () => {
    // Xác nhận nhân viên đã thu tiền mặt
    if (!confirm('Xác nhận đã thu đủ tiền mặt từ khách hàng?')) return;
    
    setCashConfirmed(true);
    // Gọi API xác nhận thanh toán
    // await confirmPayment(selectedSessionId, 'cash', reconcileResult.diff);
    
    setReconcileResult(prev => ({...prev, payment_status: 'completed'}));
    alert('Đã xác nhận thanh toán tiền mặt!');
    setShowPaymentModal(false);
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

  const formatMoney = (v) => {
    if (v === null || v === undefined || v === '') return 'N/A';
    const n = Number(v) ?? 0;
    return n.toLocaleString('vi-VN') + ' VNĐ';
  };

  const isPendingPayment = reconcileResult?.payment_status === 'pending' && 
                          reconcileResult?.action === 'charge' && 
                          Number(reconcileResult?.diff) > 0;

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

        {/* Error */}
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
          {/* Active Points */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Điểm Sạc Hoạt Động ({Array.isArray(activePoints?.active) ? activePoints.active.length : 0})
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
                      <span className="font-semibold text-gray-900">Cổng {point.connector_id || point.point_id}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(point.status)}`}>{point.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">User: {point.user_id || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{point.energy_kwh ? `${point.energy_kwh.toFixed(2)} kWh` : '0 kWh'}</p>
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
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Chi Tiết Phiên Sạc</h2>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded" />
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
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSession.status)}`}>{currentSession.status}</span>
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

                      <div className="flex gap-3 pt-4 border-t">
                        {(currentSession.status === 'active' || currentSession.status === 'charging') && (
                          <button onClick={handlePause} disabled={loadingSession} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"><Pause size={18} />Tạm dừng</button>
                        )}
                        {currentSession.status === 'paused' && (
                          <button onClick={handleResume} disabled={loadingSession} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"><Play size={18} />Tiếp tục</button>
                        )}
                        {(currentSession.status === 'active' || currentSession.status === 'charging' || currentSession.status === 'paused') && (
                          <button onClick={handleStop} disabled={loadingSession} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"><Square size={18} />Dừng sạc</button>
                        )}
                        {(currentSession.status === 'stopped' || currentSession.status === 'completed') && (
                          <button onClick={() => getInvoiceBySession(selectedSessionId)} disabled={loadingInvoice} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"><DollarSign size={18} />Xem hóa đơn</button>
                        )}

                        <button onClick={handleReconcile} disabled={loadingReconcile} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loadingReconcile ? 'Đang xử lý...' : 'Xem chi tiết thanh toán'}</button>
                      </div>
                    </div>
                  )}
                </div>

                {(reconcileResult || loadingReconcile) && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thông Tin Thanh Toán / Điều Chỉnh</h3>
                    {loadingReconcile ? (
                      <p className="text-gray-600">Đang lấy thông tin thanh toán...</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Reservation ID</span><span className="font-semibold">{reconcileResult?.reservation_id || 'N/A'}</span></div>
                        <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Số tiền đã trả (reserved)</span><span className="font-semibold">{formatMoney(reconcileResult?.reserved)}</span></div>
                        <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Số tiền thực tế</span><span className="font-semibold">{formatMoney(reconcileResult?.actual)}</span></div>
                        <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Chênh lệch</span><span className="font-semibold">{formatMoney(reconcileResult?.diff)}</span></div>
                        <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Hành động</span><span className="font-semibold">{reconcileResult?.action || 'N/A'}</span></div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Trạng thái thanh toán</span>
                          <span className={`font-semibold ${reconcileResult?.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {reconcileResult?.payment_status === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                          </span>
                        </div>
                        {reconcileResult?.refundAmount !== undefined && (
                          <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Số tiền hoàn trả</span><span className="font-semibold">{formatMoney(reconcileResult?.refundAmount)}</span></div>
                        )}
                        <div className="flex justify-between py-2"><span className="text-gray-600">Tự động quyết toán</span><span className="font-semibold">{reconcileResult?.autoSettled ? 'Có' : 'Không'}</span></div>

                        <div className="flex gap-3 mt-4">
                          <button onClick={handleRefreshReconcile} disabled={loadingReconcile} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Làm mới kết quả</button>

                          {/* Chỉ hiện nút thanh toán khi payment_status = pending */}
                          {isPendingPayment && (
                            <button
                              onClick={handleOpenPaymentModal}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
                            >
                              <DollarSign size={18} />
                              Chuyển đến thanh toán
                            </button>
                          )}

                          {reconcileResult?.payment_status === 'completed' && (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle size={20} />
                              <span className="font-medium">Đã thanh toán</span>
                            </div>
                          )}

                          {(currentSession?.status === 'stopped' || currentSession?.status === 'completed') && (
                            <button onClick={() => getInvoiceBySession(selectedSessionId)} className="ml-auto px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Xem hóa đơn</button>
                          )}
                        </div>

                        {Number(reconcileResult?.diff) > 0 && reconcileResult?.action === 'charge' && reconcileResult?.payment_status === 'pending' && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100"><p className="text-yellow-800">⚠️ Khách cần trả thêm: {formatMoney(reconcileResult.diff)}</p></div>
                        )}

                        {reconcileResult?.action === 'refund' && Number(reconcileResult?.refundAmount) > 0 && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100"><p className="text-green-800">Sẽ hoàn trả: {formatMoney(reconcileResult.refundAmount)}</p></div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {telemetry && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thông Số Thời Gian Thực</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-600 mb-1">Năng lượng</p><p className="text-2xl font-bold text-blue-900">{telemetry.energy_kwh?.toFixed(2) || '0.00'} <span className="text-sm">kWh</span></p></div>
                      <div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-green-600 mb-1">Công suất</p><p className="text-2xl font-bold text-green-900">{telemetry.power_kw?.toFixed(1) || '0.0'} <span className="text-sm">kW</span></p></div>
                      <div className="bg-purple-50 p-4 rounded-lg"><p className="text-sm text-purple-600 mb-1">Dòng điện</p><p className="text-2xl font-bold text-purple-900">{telemetry.current_a?.toFixed(1) || '0.0'} <span className="text-sm">A</span></p></div>
                      <div className="bg-orange-50 p-4 rounded-lg"><p className="text-sm text-orange-600 mb-1">Điện áp</p><p className="text-2xl font-bold text-orange-900">{telemetry.voltage_v?.toFixed(0) || '0'} <span className="text-sm">V</span></p></div>
                    </div>
                    {telemetry.soc && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg"><p className="text-sm text-gray-600 mb-2">Mức pin (SoC)</p><div className="flex items-center gap-3"><div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden"><div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${telemetry.soc}%` }} /></div><span className="font-bold text-gray-900">{telemetry.soc}%</span></div></div>
                    )}
                  </div>
                )}

                {Array.isArray(sessionEvents) && sessionEvents.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock size={20} />Lịch Sử Sự Kiện</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sessionEvents.map((event, idx) => (
                        <div key={`event-${idx}-${event.id || ''}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{event.event_type || event.type}</p>
                            <p className="text-sm text-gray-600">{event.description || event.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(event.timestamp || event.created_at).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowPaymentModal(false)} />
                    <div className="bg-white rounded-lg shadow-xl z-60 max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
                      <h4 className="text-xl font-bold mb-4">Thanh toán phiên sạc</h4>
                      
                      {/* Thông tin thanh toán */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Session ID:</span>
                            <p className="font-mono font-medium">{selectedSessionId?.substring(0, 8)}...</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Số tiền cần thanh toán:</span>
                            <p className="font-bold text-lg text-red-600">{formatMoney(reconcileResult?.diff)}</p>
                          </div>
                        </div>
                      </div>

                      {paymentStep === 'select' && (
                        <>
                          <p className="text-gray-700 mb-4">Chọn phương thức thanh toán:</p>
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <button
                              onClick={() => handleSelectPaymentMethod('cash')}
                              className={`p-6 border-2 rounded-lg transition-all ${
                                selectedPaymentMethod === 'cash'
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="text-4xl mb-2">💵</div>
                              <div className="font-semibold">Tiền mặt</div>
                              <div className="text-xs text-gray-500 mt-1">Thu tại quầy</div>
                            </button>

                            <button
                              onClick={() => handleSelectPaymentMethod('bank')}
                              className={`p-6 border-2 rounded-lg transition-all ${
                                selectedPaymentMethod === 'bank'
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="text-4xl mb-2">🏦</div>
                              <div className="font-semibold">Chuyển khoản</div>
                              <div className="text-xs text-gray-500 mt-1">Quét mã QR</div>
                            </button>

                            <button
                              onClick={() => handleSelectPaymentMethod('wallet')}
                              className={`p-6 border-2 rounded-lg transition-all ${
                                selectedPaymentMethod === 'wallet'
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="text-4xl mb-2">📱</div>
                              <div className="font-semibold">Ví điện tử</div>
                              <div className="text-xs text-gray-500 mt-1">MoMo, ZaloPay...</div>
                            </button>
                          </div>

                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setShowPaymentModal(false)}
                              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={handleProceedPayment}
                              disabled={!selectedPaymentMethod}
                              className={`px-6 py-2 rounded-lg text-white ${
                                !selectedPaymentMethod
                                  ? 'bg-gray-300 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              Tiếp tục
                            </button>
                          </div>
                        </>
                      )}

                      {paymentStep === 'processing' && selectedPaymentMethod === 'bank' && (
                        <div className="text-center py-6">
                          <h5 className="text-lg font-semibold mb-4">Quét mã QR để thanh toán</h5>
                          
                          {!qrCodeUrl ? (
                            <div className="flex flex-col items-center justify-center py-12">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                              <p className="text-gray-600">Đang tạo mã QR...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                              </div>
                              
                              <div className="bg-blue-50 rounded-lg p-4 mb-4 max-w-md">
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>Thông tin chuyển khoản:</strong>
                                </p>
                                <div className="text-left text-sm space-y-1">
                                  <p>• Số tiền: <strong>{formatMoney(reconcileResult?.diff)}</strong></p>
                                  <p>• Nội dung: <strong>PAY {selectedSessionId?.substring(0, 8)}</strong></p>
                                  <p>• Ngân hàng: <strong>Vietcombank</strong></p>
                                  <p>• STK: <strong>1234567890</strong></p>
                                </div>
                              </div>

                              <div className="text-sm text-gray-500 mb-4">
                                ⏱️ Vui lòng quét mã QR hoặc chuyển khoản trong 10 phút
                              </div>

                              <button
                                onClick={() => {
                                  // Giả lập xác nhận đã thanh toán
                                  if (confirm('Xác nhận khách hàng đã chuyển khoản thành công?')) {
                                    setReconcileResult(prev => ({...prev, payment_status: 'completed'}));
                                    alert('Đã xác nhận thanh toán chuyển khoản!');
                                    setShowPaymentModal(false);
                                  }
                                }}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                Xác nhận đã nhận tiền
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setPaymentStep('select');
                              setQrCodeUrl(null);
                            }}
                            className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            ← Quay lại
                          </button>
                        </div>
                      )}

                      {paymentStep === 'processing' && selectedPaymentMethod === 'wallet' && (
                        <div className="text-center py-8">
                          <h5 className="text-lg font-semibold mb-4">Thanh toán qua Ví điện tử</h5>
                          
                          {walletPolling ? (
                            <div className="flex flex-col items-center justify-center py-8">
                              <div className="relative mb-6">
                                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-3xl">📱</span>
                                </div>
                              </div>
                              <p className="text-lg font-medium text-gray-900 mb-2">
                                Đang chờ xác nhận từ ví điện tử...
                              </p>
                              <p className="text-sm text-gray-600 mb-4">
                                Vui lòng mở ứng dụng ví và xác nhận thanh toán
                              </p>
                              <div className="bg-yellow-50 rounded-lg p-4 max-w-md">
                                <p className="text-sm text-yellow-800">
                                  💡 Hệ thống đang tự động kiểm tra trạng thái thanh toán
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-green-600">
                              <CheckCircle size={64} className="mx-auto mb-4" />
                              <p className="text-lg font-semibold">Thanh toán thành công!</p>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setWalletPolling(false);
                              setPaymentStep('select');
                            }}
                            disabled={walletPolling}
                            className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                          >
                            ← Quay lại
                          </button>
                        </div>
                      )}

                      {paymentStep === 'processing' && selectedPaymentMethod === 'cash' && (
                        <div className="text-center py-8">
                          <h5 className="text-lg font-semibold mb-4">Thanh toán tiền mặt</h5>
                          
                          <div className="flex flex-col items-center">
                            <div className="text-6xl mb-4">💵</div>
                            
                            <div className="bg-yellow-50 rounded-lg p-6 mb-6 max-w-md">
                              <p className="text-lg font-bold text-gray-900 mb-2">
                                Số tiền cần thu:
                              </p>
                              <p className="text-3xl font-bold text-red-600 mb-4">
                                {formatMoney(reconcileResult?.diff)}
                              </p>
                              <p className="text-sm text-gray-700">
                                Vui lòng thu đủ số tiền từ khách hàng trước khi xác nhận
                              </p>
                            </div>

                            {!cashConfirmed ? (
                              <div className="space-y-3">
                                <button
                                  onClick={handleConfirmCashPayment}
                                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg font-semibold flex items-center gap-2"
                                >
                                  <CheckCircle size={24} />
                                  Xác nhận đã thu tiền
                                </button>
                                <p className="text-xs text-gray-500">
                                  Nhấn nút trên khi đã nhận đủ tiền mặt từ khách hàng
                                </p>
                              </div>
                            ) : (
                              <div className="text-green-600">
                                <CheckCircle size={64} className="mx-auto mb-4" />
                                <p className="text-lg font-semibold">Đã xác nhận thu tiền!</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setCashConfirmed(false);
                              setPaymentStep('select');
                            }}
                            className="mt-6 px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            ← Quay lại
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;