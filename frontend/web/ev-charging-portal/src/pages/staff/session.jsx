import React, { useState, useEffect, useCallback } from "react";
import { useChargingControl } from "@/hooks/useChargingControl";
import paymentService from "@/services/paymentService"; // Đảm bảo đường dẫn đúng
import {
  Battery,
  Zap,
  Pause,
  Play,
  Square,
  RefreshCw,
  AlertCircle,
  Clock,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATION_ID = "22222222-2222-2222-2222-222222222222";

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
  const [cashConfirmed, setCashConfirmed] = useState(false);

  // Transaction states
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);

  // useCallback để tạo transaction
  const createTransaction = useCallback(async (payload) => {
    setLoadingTransactions(true);
    setTransactionError(null);
    try {
      const res = await paymentService.createTransaction(payload);
      const data = res?.data ?? res;
      setLastPayment((prev) => data ?? prev);
      return { success: true, data };
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Thanh toán thất bại";
      setTransactionError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    loadActivePoints();
  }, []);

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
      setCashConfirmed(false);
      setTransactionError(null);
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
    if (!confirm("Bạn có chắc muốn dừng phiên sạc này?")) return;
    const result = await stopSession({ session_id: selectedSessionId });
    if (result?.success) {
      await getInvoiceBySession(selectedSessionId);
      await loadActivePoints();

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
              payment_status: "pending",
              autoSettled: false,
            };
          }

          if (
            payload &&
            (payload.reservation_id ||
              payload.reserved !== undefined ||
              payload.actual !== undefined)
          ) {
            setReconcileResult(payload);
          } else {
            setReconcileResult(null);
          }
        } else {
          const invoiceResult = await getInvoiceBySession(selectedSessionId);
          const invoiceData = invoiceResult?.data ?? invoiceResult;
          const finalCost =
            invoiceData?.total_cost ??
            invoiceData?.cost ??
            result.data?.cost ??
            0;

          setReconcileResult({
            reservation_id: null,
            reserved: 0,
            actual: finalCost,
            diff: finalCost,
            action: finalCost > 0 ? "charge" : "none",
            payment_status: "pending",
            autoSettled: false,
            note: "Phiên không có đặt trước - thanh toán toàn bộ",
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

    const hasReservation =
      currentSession?.reservation_id != null &&
      currentSession?.reservation_id !== "";

    if (!hasReservation) {
      setLoadingReconcile(true);
      try {
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
          payment_status: "pending",
          autoSettled: false,
          note: "Phiên không có đặt trước - thanh toán toàn bộ",
        });
      } catch (e) {
        console.error("Error getting invoice:", e);
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
      let payloadResp = data?.result ?? data;

      if (
        payloadResp &&
        ["charge", "charge_due"].includes(payloadResp.action) &&
        Number(payloadResp.diff) > 0
      ) {
        payloadResp = {
          ...payloadResp,
          payment_status: "pending",
          autoSettled: false,
        };
      }

      setReconcileResult(payloadResp ?? null);
      await refreshSession(selectedSessionId);
    }
  };

  const handleRefreshReconcile = async () => {
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
            payment_status: "pending",
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
      // ignore
    } finally {
      setLoadingReconcile(false);
    }
  };

  const handleSelectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
    setQrCodeUrl(null);
    setWalletPolling(false);
    setCashConfirmed(false);
    setTransactionError(null);
  };

  // Xử lý thanh toán thực tế
  const handleProceedPayment = async () => {
    if (!selectedPaymentMethod || !reconcileResult?.diff || reconcileResult.diff <= 0) return;

    const amount = Number(reconcileResult.diff);
    const user_id = currentSession?.user_id;
    const session_id = selectedSessionId;
    const start_time = currentSession?.start_time || currentSession?.created_at;
    const end_time = currentSession?.end_time || new Date().toISOString();

    if (!user_id || !session_id) {
      alert("Thiếu thông tin người dùng hoặc phiên sạc");
      return;
    }

    const payload = {
      user_id,
      type: "payment",
      method: selectedPaymentMethod,
      related_id: session_id,
      related_type: "charging_session",
      amount,
      meta: {
        description: `Thanh toán đặt sạc tại trạm ${STATION_ID}`,
        start_time,
        end_time,
      },
    };

    setShowPaymentModal(true);

    // Chỉ xử lý thực tế cho ví và chuyển khoản
    if (selectedPaymentMethod === "bank") {
      setTimeout(() => {
        const mockQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PAY:${session_id}:${amount}`;
        setQrCodeUrl(mockQR);
      }, 1000);
    } else if (selectedPaymentMethod === "wallet") {
      setWalletPolling(true);
      pollWalletPayment();
    } else if (selectedPaymentMethod === "cash") {
      // Không gọi API, chỉ xác nhận thủ công
      return;
    }

    // Gọi API thanh toán cho bank/wallet
    const result = await createTransaction(payload);

    if (result.success) {
      setReconcileResult((prev) => ({
        ...prev,
        payment_status: "completed",
      }));
      alert("Thanh toán thành công!");
      setShowPaymentModal(false);
    } else {
      // Không đóng modal nếu lỗi, để người dùng thử lại
      console.error("Payment failed:", result.error);
    }
  };

  const pollWalletPayment = () => {
    const interval = setInterval(async () => {
      const paymentSuccess = Math.random() > 0.7;
      if (paymentSuccess) {
        clearInterval(interval);
        setWalletPolling(false);
        setReconcileResult((prev) => ({
          ...prev,
          payment_status: "completed",
        }));
        alert("Thanh toán ví thành công!");
        setShowPaymentModal(false);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      setWalletPolling(false);
    }, 60000);
  };

  const handleConfirmCashPayment = async () => {
    if (!confirm("Xác nhận đã thu đủ tiền mặt từ khách hàng?")) return;

    // Gọi API thanh toán cho tiền mặt
    const amount = Number(reconcileResult.diff);
    const payload = {
      user_id: currentSession?.user_id,
      type: "payment",
      method: "cash",
      related_id: selectedSessionId,
      related_type: "charging_session",
      amount,
      meta: {
        description: `Thanh toán tiền mặt tại trạm ${STATION_ID}`,
        start_time: currentSession?.start_time || currentSession?.created_at,
        end_time: new Date().toISOString(),
      },
    };

    const result = await createTransaction(payload);
    if (result.success) {
      setCashConfirmed(true);
      setReconcileResult((prev) => ({ ...prev, payment_status: "completed" }));
      alert("Đã xác nhận thanh toán tiền mặt!");
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

  const formatMoney = (v) => {
    if (v === null || v === undefined || v === "") return "N/A";
    const n = Number(v) ?? 0;
    return n.toLocaleString("vi-VN") + " VNĐ";
  };

  const isPendingPayment =
    reconcileResult?.payment_status === "pending" &&
    ["charge", "charge_due"].includes(reconcileResult?.action) &&
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
          {/* Active Points */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Điểm Sạc Hoạt Động (
                {Array.isArray(activePoints?.active)
                  ? activePoints.active.length
                  : 0}
                )
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
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
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Chi Tiết Phiên Sạc
                    </h2>
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
                          <p className="font-mono text-sm">
                            {currentSession.session_id || currentSession.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Trạng thái</p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              currentSession.status
                            )}`}
                          >
                            {currentSession.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">User ID</p>
                          <p className="font-medium">
                            {currentSession.user_id || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Connector</p>
                          <p className="font-medium">
                            {currentSession.connector_id || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t">
                        {(currentSession.status === "active" ||
                          currentSession.status === "charging") && (
                          <button
                            onClick={handlePause}
                            disabled={loadingSession}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                          >
                            <Pause size={18} />
                            Tạm dừng
                          </button>
                        )}
                        {currentSession.status === "paused" && (
                          <button
                            onClick={handleResume}
                            disabled={loadingSession}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            <Play size={18} />
                            Tiếp tục
                          </button>
                        )}
                        {(currentSession.status === "active" ||
                          currentSession.status === "charging" ||
                          currentSession.status === "paused") && (
                          <button
                            onClick={handleStop}
                            disabled={loadingSession}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            <Square size={18} />
                            Dừng sạc
                          </button>
                        )}
                        {(currentSession.status === "stopped" ||
                          currentSession.status === "completed") && (
                          <button
                            onClick={() =>
                              getInvoiceBySession(selectedSessionId)
                            }
                            disabled={loadingInvoice}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            <DollarSign size={18} />
                            Xem hóa đơn
                          </button>
                        )}

                        <button
                          onClick={handleReconcile}
                          disabled={loadingReconcile}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loadingReconcile
                            ? "Đang xử lý..."
                            : "Xem chi tiết thanh toán"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {(reconcileResult || loadingReconcile) && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Thông Tin Thanh Toán / Điều Chỉnh
                    </h3>
                    {loadingReconcile ? (
                      <p className="text-gray-600">
                        Đang lấy thông tin thanh toán...
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">
                              Reservation ID
                            </span>
                            <span className="font-semibold">
                              {reconcileResult?.reservation_id || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">
                              Số tiền đã trả (reserved)
                            </span>
                            <span className="font-semibold">
                              {formatMoney(reconcileResult?.reserved)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">
                              Số tiền thực tế
                            </span>
                            <span className="font-semibold">
                              {formatMoney(reconcileResult?.actual)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Chênh lệch</span>
                            <span className="font-semibold">
                              {formatMoney(reconcileResult?.diff)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Hành động</span>
                            <span className="font-semibold">
                              {reconcileResult?.action || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">
                              Trạng thái thanh toán
                            </span>
                            <span
                              className={`font-semibold ${
                                reconcileResult?.payment_status === "completed"
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {reconcileResult?.payment_status === "completed"
                                ? "Đã thanh toán"
                                : "Chờ thanh toán"}
                            </span>
                          </div>
                        </div>

                        {/* Payment Method Selection */}
                        {isPendingPayment && (
                          <div className="pt-4 border-t">
                            <p className="text-gray-700 font-semibold mb-3">
                              Chọn phương thức thanh toán:
                            </p>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <button
                                onClick={() => handleSelectPaymentMethod("cash")}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                  selectedPaymentMethod === "cash"
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-gray-200 hover:border-blue-300"
                                }`}
                              >
                                <div className="text-3xl mb-1">Money</div>
                                <div className="font-semibold text-sm">
                                  Tiền mặt
                                </div>
                              </button>

                              <button
                                onClick={() => handleSelectPaymentMethod("bank_transfer")}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                  selectedPaymentMethod === "bank_transfer"
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-gray-200 hover:border-blue-300"
                                }`}
                              >
                                <div className="text-3xl mb-1">Bank</div>
                                <div className="font-semibold text-sm">
                                  Chuyển khoản
                                </div>
                              </button>

                              <button
                                onClick={() => handleSelectPaymentMethod("wallet")}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                  selectedPaymentMethod === "wallet"
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-gray-200 hover:border-blue-300"
                                }`}
                              >
                                <div className="text-3xl mb-1">Mobile</div>
                                <div className="font-semibold text-sm">
                                  Ví điện tử
                                </div>
                              </button>
                            </div>

                            <button
                              onClick={handleProceedPayment}
                              disabled={!selectedPaymentMethod || loadingTransactions}
                              className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 ${
                                !selectedPaymentMethod || loadingTransactions
                                  ? "bg-gray-300 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {loadingTransactions ? (
                                <>Đang xử lý...</>
                              ) : (
                                <>
                                  <DollarSign size={20} />
                                  Tiến hành thanh toán
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {reconcileResult?.payment_status === "completed" && (
                          <div className="flex items-center justify-center gap-2 text-green-600 py-3 bg-green-50 rounded-lg">
                            <CheckCircle size={24} />
                            <span className="font-semibold text-lg">
                              Đã thanh toán thành công
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ... (Telemetry, Events, Modal giữ nguyên) */}
                {/* Modal thanh toán giữ nguyên như cũ, chỉ thêm loading/error nếu cần */}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;