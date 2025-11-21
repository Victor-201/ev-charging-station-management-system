import React, { useState, useEffect, useCallback } from "react";
import { useChargingControl } from "@/hooks/useChargingControl";
import {
  Battery,
  Zap,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SessionDetails from "./SessionDetails";
import PaymentModal from "./PaymentModal";

const STATION_ID = "550e8400-e29b-41d4-a716-446655440001";

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

  // Payment states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [walletPolling, setWalletPolling] = useState(false);

  // Transaction states
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);

  // Refund state
  const [loadingRefund, setLoadingRefund] = useState(false);

  // Hàm refresh toàn bộ dữ liệu của session hiện tại
  const refreshCurrentSession = useCallback(async () => {
    if (!selectedSessionId) return;
    
    try {
      await Promise.all([
        getSessionById(selectedSessionId),
        getTelemetry(selectedSessionId),
        getSessionEvents(selectedSessionId),
      ]);
    } catch (err) {
      console.error("Error refreshing session:", err);
    }
  }, [selectedSessionId, getSessionById, getTelemetry, getSessionEvents]);

  // Hàm refresh reconcile data
  const refreshReconcileData = useCallback(async () => {
    if (!selectedSessionId) return;

    const hasReservation =
      currentSession?.reservation_id != null &&
      currentSession?.reservation_id !== "";

    try {
      setLoadingReconcile(true);
      if (hasReservation) {
        const rec = await reconcileSession(selectedSessionId, {});
        const data = rec?.data ?? rec;
        let payload = data?.result ?? data;

        if (
          payload &&
          ["charge", "charge_due"].includes(payload.action) &&
          Number(payload.diff) > 0
        ) {
          payload = {
            ...payload,
            payment_status: reconcileResult?.payment_status || "pending",
            autoSettled: false,
          };
        }
        setReconcileResult(payload ?? null);
      } else {
        const invoiceResult = await getInvoiceBySession(selectedSessionId);
        const invoiceData = invoiceResult?.data ?? invoiceResult;
        const finalCost =
          invoiceData?.total_cost ??
          invoiceData?.cost ??
          currentSession?.cost ??
          0;

        setReconcileResult({
          reservation_id: null,
          reserved: 0,
          actual: finalCost,
          diff: finalCost,
          action: finalCost > 0 ? "charge" : "none",
          payment_status: reconcileResult?.payment_status || "pending",
          autoSettled: false,
          note: "Phiên không có đặt trước - thanh toán toàn bộ",
        });
      }
    } catch (e) {
      console.error("Error refreshing reconcile:", e);
    } finally {
      setLoadingReconcile(false);
    }
  }, [selectedSessionId, currentSession, reconcileSession, getInvoiceBySession, reconcileResult?.payment_status]);

  useEffect(() => {
    loadActivePoints();
  }, []);

  // Auto refresh telemetry khi session đang active
  useEffect(() => {
    if (!autoRefresh || !selectedSessionId) return;
    const interval = setInterval(() => {
      if (
        currentSession?.status === "active" ||
        currentSession?.status === "charging"
      ) {
        getTelemetry(selectedSessionId);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedSessionId, currentSession?.status, getTelemetry]);

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
      setSelectedPaymentMethod(null);
      setQrCodeUrl(null);
      setWalletPolling(false);
      setTransactionError(null);
      setShowPaymentModal(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      charging: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      stopped: "bg-gray-100 text-gray-800",
      completed: "bg-blue-100 text-blue-800",
      error: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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
              <RefreshCw
                size={18}
                className={loadingSession ? "animate-spin" : ""}
              />
              Làm mới
            </button>
          </div>
        </div>

        {/* Global Error */}
        {(error || transactionError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Lỗi</p>
              <p className="text-red-700 text-sm">
                {transactionError || error.message || "Đã xảy ra lỗi"}
              </p>
            </div>
            <button
              onClick={() => {
                clearError();
                setTransactionError(null);
              }}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Points - sticky on large screens */}
          <div className="lg:col-span-1">
            {/* Use lg:sticky + lg:top-6 so the panel sticks on larger screens.
                The inner list has a max-height calculated from viewport so it scrolls independently. */}
            <div className="bg-white rounded-lg shadow-md p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Điểm Sạc Hoạt Động (
                {Array.isArray(activePoints?.active)
                  ? activePoints.active.length
                  : 0}
                )
              </h2>

              {/* Scrolling container: limit height so it won't overflow the viewport.
                  We subtract an estimated header/padding height (e.g., 220px) to ensure it fits.
                  Adjust the calc(...) value if your header/footer heights differ. */}
              <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
                {Array.isArray(activePoints?.active) &&
                  activePoints.active.map((point, index) => (
                    <div
                      key={point.session_id || point.id || `point-${index}`}
                      onClick={() =>
                        handleSelectSession(point.session_id || point.id)
                      }
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedSessionId === (point.session_id || point.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">
                          Cổng {point.connector_id || point.point_id}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            point.status
                          )}`}
                        >
                          {point.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        User: {point.user_id || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {point.energy_kwh
                          ? `${point.energy_kwh.toFixed(2)} kWh`
                          : "0 kWh"}
                      </p>
                    </div>
                  ))}
                {(!Array.isArray(activePoints?.active) ||
                  activePoints.active.length === 0) && (
                  <p className="text-center text-gray-500 py-8">
                    Không có phiên sạc nào đang hoạt động
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedSessionId ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Battery size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">
                  Chọn một phiên sạc để xem chi tiết
                </p>
              </div>
            ) : (
              <SessionDetails
                selectedSessionId={selectedSessionId}
                currentSession={currentSession}
                telemetry={telemetry}
                sessionEvents={sessionEvents}
                reconcileResult={reconcileResult}
                loadingSession={loadingSession}
                loadingReconcile={loadingReconcile}
                loadingRefund={loadingRefund}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                refreshCurrentSession={refreshCurrentSession}
                pauseSession={pauseSession}
                resumeSession={resumeSession}
                stopSession={stopSession}
                getInvoiceBySession={getInvoiceBySession}
                reconcileSession={reconcileSession}
                setReconcileResult={setReconcileResult}
                setLoadingReconcile={setLoadingReconcile}
                loadActivePoints={loadActivePoints}
                refreshReconcileData={refreshReconcileData}
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
                setShowPaymentModal={setShowPaymentModal}
                STATION_ID={STATION_ID}
                setLoadingRefund={setLoadingRefund}
                setTransactionError={setTransactionError}
              />
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          showPaymentModal={showPaymentModal}
          setShowPaymentModal={setShowPaymentModal}
          selectedPaymentMethod={selectedPaymentMethod}
          reconcileResult={reconcileResult}
          currentSession={currentSession}
          selectedSessionId={selectedSessionId}
          qrCodeUrl={qrCodeUrl}
          setQrCodeUrl={setQrCodeUrl}
          walletPolling={walletPolling}
          setWalletPolling={setWalletPolling}
          loadingTransactions={loadingTransactions}
          setLoadingTransactions={setLoadingTransactions}
          transactionError={transactionError}
          setTransactionError={setTransactionError}
          setReconcileResult={setReconcileResult}
          refreshReconcileData={refreshReconcileData}
          refreshCurrentSession={refreshCurrentSession}
          loadActivePoints={loadActivePoints}
          STATION_ID={STATION_ID}
        />
      )}
    </div>
  );
};

export default SessionManager;
