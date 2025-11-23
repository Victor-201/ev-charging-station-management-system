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
import stationService from "@/services/stationService"; // ensure this exists

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

  // Assigned station state (dynamically lấy từ API)
  const [assignedStation, setAssignedStation] = useState(null);
  const [loadingStation, setLoadingStation] = useState(false);
  const [stationError, setStationError] = useState(null);

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

  // loadActivePoints bây giờ nhận stationId động
  const loadActivePoints = useCallback(async (stationId) => {
    if (!stationId) return;
    try {
      await getActivePointsByStation(stationId);
    } catch (err) {
      console.error("Error loading active points:", err);
    }
  }, [getActivePointsByStation]);

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

  // ========== LẤY ASSIGNED STATION ==========
  // 1) Try stationService.getAssignedStation() directly (assumes apiClient sends auth header)
  // 2) Fallback: read token from localStorage, hash SHA-256 and call endpoint with ?token_hash=...
  const sha256Hex = async (message) => {
    if (!message) return null;
    try {
      const enc = new TextEncoder();
      const data = enc.encode(message);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      return hashHex;
    } catch (e) {
      console.error("sha256 error", e);
      return null;
    }
  };

  const fetchAssignedStation = useCallback(async () => {
    setLoadingStation(true);
    setStationError(null);

    // Try direct call first (assumes apiClient includes Authorization header)
    try {
      const res = await stationService.getAssignedStation();
      const data = res?.data ?? res;
      if (data && (data.id || data.station_id)) {
        setAssignedStation(data);
        setLoadingStation(false);
        // load active points for this station
        await loadActivePoints(data.id || data.station_id);
        return data;
      }
    } catch (err) {
      console.warn("getAssignedStation direct call failed, will attempt token-hash fallback:", err);
    }

    // Fallback: attempt to read token from localStorage and call endpoint with token_hash
    try {
      const tokenKeys = ["token", "access_token", "authToken", "accessToken"];
      let token = null;
      for (const k of tokenKeys) {
        const t = localStorage.getItem(k);
        if (t) {
          token = t;
          break;
        }
      }

      // If not found, try common object 'auth' in localStorage
      if (!token) {
        const authStr = localStorage.getItem("auth") || localStorage.getItem("user");
        if (authStr) {
          try {
            const parsed = JSON.parse(authStr);
            token = parsed?.token || parsed?.access_token || parsed?.accessToken || null;
          } catch (e) {
            // ignore parse error
          }
        }
      }

      if (!token) {
        throw new Error("No token found in localStorage for fallback request");
      }

      const hashed = await sha256Hex(token);
      if (!hashed) throw new Error("Failed to hash token");

      // call endpoint with token_hash param - adjust if your backend expects different param or header
      const url = `api/v1/staff/assigned-station?token_hash=${hashed}`;
      // use apiClient via stationService if you prefer; here we call stationService.getAssignedStationWithHash if exists
      // fallback to direct fetch using window.fetch (will not include default apiClient baseURL/headers)
      // Try stationService if it supports passing params:
      if (stationService.getAssignedStationWithHash) {
        const res2 = await stationService.getAssignedStationWithHash(hashed);
        const data2 = res2?.data ?? res2;
        setAssignedStation(data2);
        await loadActivePoints(data2.id || data2.station_id);
        setLoadingStation(false);
        return data2;
      } else {
        // best-effort: call with fetch to relative path
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const full = `${base}/api/v1/staff/assigned-station?token_hash=${hashed}`;
        const r = await fetch(full, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // optionally send Authorization too:
            Authorization: `Bearer ${token}`,
          },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data3 = await r.json();
        setAssignedStation(data3);
        await loadActivePoints(data3.id || data3.station_id);
        setLoadingStation(false);
        return data3;
      }
    } catch (err) {
      console.error("Failed to fetch assigned station:", err);
      setStationError(err);
      setLoadingStation(false);
      return null;
    }
  }, [loadActivePoints]);

  // mount: fetch assigned station
  useEffect(() => {
    fetchAssignedStation();
  }, [fetchAssignedStation]);

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
              <p className="text-gray-600 mt-1">
                Trạm:{" "}
                {loadingStation ? (
                  <span className="text-gray-500">Đang tải...</span>
                ) : assignedStation ? (
                  <span>{assignedStation.name} ({assignedStation.id})</span>
                ) : stationError ? (
                  <span className="text-red-600">Lỗi lấy trạm</span>
                ) : (
                  <span className="text-gray-500">Chưa xác định</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchAssignedStation()}
                disabled={loadingStation || loadingSession}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={loadingStation || loadingSession ? "animate-spin" : ""}
                />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Global Error */}
        {(error || transactionError || stationError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Lỗi</p>
              <p className="text-red-700 text-sm">
                {transactionError?.message ||
                  stationError?.message ||
                  error?.message ||
                  "Đã xảy ra lỗi"}
              </p>
            </div>
            <button
              onClick={() => {
                clearError();
                setTransactionError(null);
                setStationError(null);
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
            <div className="bg-white rounded-lg shadow-md p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Điểm Sạc Hoạt Động (
                {Array.isArray(activePoints?.active)
                  ? activePoints.active.length
                  : 0}
                )
              </h2>

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
                loadActivePoints={() => loadActivePoints(assignedStation?.id || assignedStation?.station_id)}
                refreshReconcileData={refreshReconcileData}
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
                setShowPaymentModal={setShowPaymentModal}
                STATION_ID={assignedStation?.id || assignedStation?.station_id}
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
          loadActivePoints={() => loadActivePoints(assignedStation?.id || assignedStation?.station_id)}
          STATION_ID={assignedStation?.id || assignedStation?.station_id}
        />
      )}
    </div>
  );
};

export default SessionManager;
