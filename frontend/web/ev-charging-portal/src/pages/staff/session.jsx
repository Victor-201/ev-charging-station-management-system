import React, { useState, useEffect, useCallback } from "react";
import { useChargingControl } from "@/hooks/useChargingControl";
import paymentService from "@/services/paymentService";
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
  X,
  ArrowLeftRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  // useCallback để tạo transaction (SỬA: set qrCodeUrl nếu backend trả meta.qrLink)
  const createTransaction = useCallback(async (payload) => {
    setLoadingTransactions(true);
    setTransactionError(null);
    try {
      const res = await paymentService.createTransaction(payload);
      const data = res?.data ?? res;

      // lấy qr link nếu có
      const qr =
        data?.meta?.qrLink ||
        data?.data?.meta?.qrLink ||
        data?.meta?.qrlink || // tolerant keys
        null;

      if (qr) {
        setQrCodeUrl(qr);
      }

      setLastPayment((prev) => data ?? prev);
      return { success: true, data };
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Giao dịch thất bại";
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
      setTransactionError(null);
      setShowPaymentModal(false);
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

    // Kiểm tra có reservation_id hay không
    const hasReservation = 
      currentSession?.reservation_id != null && 
      currentSession?.reservation_id !== "";

    // Xác định related_type dựa trên reservation_id
    const related_type = hasReservation ? "charging_session" : "guest_charging";

    if (!user_id || !session_id) {
      alert("Thiếu thông tin người dùng hoặc phiên sạc");
      return;
    }

    const payload = {
      user_id,
      type: "payment",
      method: selectedPaymentMethod,
      related_id: session_id,
      related_type: related_type,
      amount,
      meta: {
        description: `Thanh toán ${hasReservation ? 'đặt sạc' : 'sạc khách vãng lai'} tại trạm ${STATION_ID}`,
        start_time,
        end_time,
        reservation_id: currentSession?.reservation_id || null,
        connector_id: currentSession?.connector_id || null,
      },
    };

    // show modal
    setShowPaymentModal(true);

    // Xử lý theo từng phương thức thanh toán
    if (selectedPaymentMethod === "bank_transfer") {
      // Gọi API tạo transaction (createTransaction sẽ set qrCodeUrl nếu backend trả meta.qrLink)
      const result = await createTransaction(payload);

      if (!result.success) {
        alert(`Tạo giao dịch thất bại: ${result.error}`);
        return;
      }

      const data = result.data ?? result;
      // backend thường trả id ở data.id
      const txId = data?.id || data?.data?.id || null;

      // lấy qr từ response nếu có (createTransaction đã set qrCodeUrl, nhưng để chắc chắn lấy lại)
      const qrFromBackend =
        data?.meta?.qrLink ||
        data?.data?.meta?.qrLink ||
        data?.meta?.qrlink ||
        null;

      if (qrFromBackend) {
        setQrCodeUrl(qrFromBackend);
      } else if (!qrCodeUrl) {
        // fallback mock QR để user có thể quét (tùy bạn bật/tắt)
        const mockQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PAY:${session_id}:${amount}`;
        setQrCodeUrl(mockQR);
      }

      // Nếu backend trả status completed ngay trong response -> đánh dấu hoàn thành
      const immediateStatus =
        (data?.status || data?.data?.status || data?.payment_status || data?.data?.payment_status || "")
          .toString()
          .toLowerCase();

      if (["completed", "success", "paid"].includes(immediateStatus)) {
        setReconcileResult((prev) => ({
          ...prev,
          payment_status: "completed",
        }));
        alert("Thanh toán chuyển khoản hoàn tất (đã nhận xác nhận).");
        setShowPaymentModal(false);
        setQrCodeUrl(null);
      } else {
        // nếu chưa completed -> giữ modal mở, hiển thị QR và chờ webhook / xác nhận thủ công
        // bạn có thể thêm tính năng "Refresh status" hoặc "Tìm giao dịch" nếu muốn
      }
    } else if (selectedPaymentMethod === "wallet") {
      // Bắt đầu polling cho ví điện tử
      setWalletPolling(true);
      pollWalletPayment();

      // Gọi API tạo transaction
      const result = await createTransaction(payload);
      if (result.success) {
        // nếu backend trả trạng thái completed trực tiếp, cập nhật
        const data = result.data ?? result;
        const immediateStatus =
          (data?.status || data?.data?.status || data?.payment_status || data?.data?.payment_status || "")
            .toString()
            .toLowerCase();
        if (["completed", "success", "paid"].includes(immediateStatus)) {
          setReconcileResult((prev) => ({
            ...prev,
            payment_status: "completed",
          }));
          setWalletPolling(false);
          setShowPaymentModal(false);
        }
      }
    } else if (selectedPaymentMethod === "cash") {
      // Chỉ hiển thị modal xác nhận, chưa gọi API
      // API sẽ được gọi khi nhấn nút "Xác nhận đã nhận tiền"
      return;
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
        setQrCodeUrl(null);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      setWalletPolling(false);
    }, 60000);
  };

  const handleConfirmCashPayment = async () => {
    if (!confirm("Xác nhận đã thu đủ tiền mặt từ khách hàng?")) return;

    const amount = Number(reconcileResult.diff);
    const user_id = currentSession?.user_id;
    const session_id = selectedSessionId;
    const start_time = currentSession?.start_time || currentSession?.created_at;
    const end_time = currentSession?.end_time || new Date().toISOString();

    // Kiểm tra có reservation_id hay không
    const hasReservation = 
      currentSession?.reservation_id != null && 
      currentSession?.reservation_id !== "";

    // Xác định related_type dựa trên reservation_id
    const related_type = hasReservation ? "charging_session" : "guest_charging";

    const payload = {
      user_id,
      type: "payment",
      method: "cash",
      related_id: session_id,
      related_type: related_type,
      amount,
      meta: {
        description: `Thanh toán tiền mặt ${hasReservation ? 'đặt sạc' : 'khách vãng lai'} tại trạm ${STATION_ID}`,
        start_time,
        end_time,
        reservation_id: currentSession?.reservation_id || null,
        connector_id: currentSession?.connector_id || null,
        payment_confirmed_at: new Date().toISOString(),
      },
    };

    const result = await createTransaction(payload);
    if (result.success) {
      setReconcileResult((prev) => ({ 
        ...prev, 
        payment_status: "completed" 
      }));
      alert("Đã xác nhận thanh toán tiền mặt thành công!");
      setShowPaymentModal(false);
      setQrCodeUrl(null);
    } else {
      alert(`Lỗi xác nhận thanh toán: ${result.error}`);
    }
  };

  // Xử lý hoàn tiền
  const handleRefund = async () => {
    if (!reconcileResult || reconcileResult.action !== "refund") return;
    if (!confirm("Bạn có chắc muốn thực hiện hoàn tiền cho khách hàng?")) return;

    const refundAmount = Math.abs(Number(reconcileResult.diff));
    const user_id = currentSession?.user_id;
    const session_id = selectedSessionId;
    const start_time = currentSession?.start_time || currentSession?.created_at;
    const end_time = currentSession?.end_time || new Date().toISOString();

    // Kiểm tra có reservation_id hay không
    const hasReservation = 
      currentSession?.reservation_id != null && 
      currentSession?.reservation_id !== "";

    // Xác định related_type dựa trên reservation_id
    const related_type = hasReservation ? "charging_session" : "guest_charging";

    if (!user_id || !session_id) {
      alert("Thiếu thông tin người dùng hoặc phiên sạc");
      return;
    }

    const payload = {
      user_id,
      type: "refund",
      method: "wallet", // Hoàn tiền thường qua hệ thống
      related_id: session_id,
      related_type: related_type,
      amount: refundAmount,
      meta: {
        description: `Hoàn tiền ${hasReservation ? 'đặt sạc' : 'sạc khách vãng lai'} tại trạm ${STATION_ID}`,
        start_time,
        end_time,
        reservation_id: currentSession?.reservation_id || null,
        connector_id: currentSession?.connector_id || null,
        refund_reason: "Sạc ít hơn đặt trước",
        refund_confirmed_at: new Date().toISOString(),
      },
    };

    setLoadingRefund(true);
    const result = await createTransaction(payload);
    setLoadingRefund(false);

    if (result.success) {
      setReconcileResult((prev) => ({ 
        ...prev, 
        payment_status: "refunded" 
      }));
      alert("Hoàn tiền thành công!");
    } else {
      alert(`Lỗi hoàn tiền: ${result.error}`);
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

  const isRefundable =
    reconcileResult?.action === "refund" &&
    Number(reconcileResult?.diff) < 0 &&
    reconcileResult?.payment_status !== "refunded";

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
                        <div>
                          <p className="text-sm text-gray-600">Reservation ID</p>
                          <p className="font-medium">
                            {currentSession.reservation_id || "Không có (khách vãng lai)"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Loại phiên</p>
                          <p className="font-medium">
                            {currentSession.reservation_id ? "Đặt trước" : "Khách vãng lai"}
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
                            </span><span className="font-semibold">
                              {reconcileResult?.reservation_id || "N/A (Khách vãng lai)"}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">
                              Loại giao dịch
                            </span>
                            <span className="font-semibold">
                              {reconcileResult?.reservation_id ? "charging_session" : "guest_charging"}
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
                            <span className={`font-semibold ${
                              Number(reconcileResult?.diff) < 0 ? "text-orange-600" : "text-blue-600"
                            }`}>
                              {formatMoney(reconcileResult?.diff)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">Hành động</span>
                            <span className={`font-semibold ${
                              reconcileResult?.action === "refund" ? "text-orange-600" : ""
                            }`}>
                              {reconcileResult?.action === "refund" && "Hoàn tiền"}
                              {reconcileResult?.action === "charge" && "Thu thêm"}
                              {reconcileResult?.action === "charge_due" && "Thu thêm (đến hạn)"}
                              {reconcileResult?.action === "none" && "Không cần điều chỉnh"}
                              {!["refund", "charge", "charge_due", "none"].includes(reconcileResult?.action) && (reconcileResult?.action || "N/A")}
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
                                  : reconcileResult?.payment_status === "refunded"
                                  ? "text-purple-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {reconcileResult?.payment_status === "completed" && "Đã thanh toán"}
                              {reconcileResult?.payment_status === "refunded" && "Đã hoàn tiền"}
                              {reconcileResult?.payment_status === "pending" && "Chờ xử lý"}
                              {!["completed", "refunded", "pending"].includes(reconcileResult?.payment_status) && (reconcileResult?.payment_status || "N/A")}
                            </span>
                          </div>
                        </div>

                        {/* Payment Method Selection - Hiển thị khi cần thu thêm tiền */}
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
                                <div className="text-3xl mb-1">💵</div>
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
                                <div className="text-3xl mb-1">🏦</div>
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
                                <div className="text-3xl mb-1">📱</div>
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

                        {/* Refund Button - Hiển thị khi cần hoàn tiền */}
                        {isRefundable && (
                          <div className="pt-4 border-t">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                              <p className="text-orange-800 text-sm">
                                Khách hàng sử dụng ít hơn số tiền đã đặt trước. Cần hoàn lại {formatMoney(Math.abs(reconcileResult.diff))}
                              </p>
                            </div>
                            <button
                              onClick={handleRefund}
                              disabled={loadingRefund}
                              className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 ${
                                loadingRefund
                                  ? "bg-gray-300 cursor-not-allowed"
                                  : "bg-orange-600 hover:bg-orange-700"
                              }`}
                            >
                              {loadingRefund ? (
                                <>Đang xử lý hoàn tiền...</>
                              ) : (
                                <>
                                  <ArrowLeftRight size={20} />
                                  Xác nhận hoàn tiền
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Payment Completed Status */}
                        {reconcileResult?.payment_status === "completed" && (
                          <div className="flex items-center justify-center gap-2 text-green-600 py-3 bg-green-50 rounded-lg">
                            <CheckCircle size={24} />
                            <span className="font-semibold text-lg">
                              Đã thanh toán thành công
                            </span>
                          </div>
                        )}

                        {/* Refunded Status */}
                        {reconcileResult?.payment_status === "refunded" && (
                          <div className="flex items-center justify-center gap-2 text-purple-600 py-3 bg-purple-50 rounded-lg">
                            <CheckCircle size={24} />
                            <span className="font-semibold text-lg">
                              Đã hoàn tiền thành công
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Telemetry Section */}
                {telemetry && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Thông Tin Telemetry
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Năng lượng</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {telemetry.energy_kwh?.toFixed(2) || "0"} kWh
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Công suất</p>
                        <p className="text-2xl font-bold text-green-600">
                          {telemetry.power_kw?.toFixed(2) || "0"} kW
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Điện áp</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {telemetry.voltage_v?.toFixed(0) || "0"} V
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Dòng điện</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {telemetry.current_a?.toFixed(2) || "0"} A
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">SoC</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {telemetry.soc_percent?.toFixed(0) || "0"}%
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Nhiệt độ</p>
                        <p className="text-2xl font-bold text-red-600">
                          {telemetry.temperature_c?.toFixed(1) || "0"}°C
                        </p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Chi phí hiện tại</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {formatMoney(telemetry.cost)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session Events */}
                {sessionEvents && sessionEvents.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Lịch Sử Sự Kiện
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sessionEvents.map((event, index) => (
                        <div
                          key={event.id || index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <Clock size={16} className="text-gray-400 mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {event.event_type}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(event.timestamp).toLocaleString("vi-VN")}
                            </p>
                            {event.data && (
                              <p className="text-xs text-gray-500 mt-1">
                                {JSON.stringify(event.data)}
                              </p>
                            )}
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
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Thanh toán
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Số tiền cần thanh toán:</span>
                <span className="font-bold text-lg text-blue-600">
                  {formatMoney(reconcileResult?.diff)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Loại giao dịch:</span>
                <span className="font-semibold">
                  {currentSession?.reservation_id ? "Đặt trước" : "Khách vãng lai"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Phương thức:</span>
                <span className="font-semibold capitalize">
                  {selectedPaymentMethod === "cash" && "Tiền mặt"}
                  {selectedPaymentMethod === "bank_transfer" && "Chuyển khoản"}
                  {selectedPaymentMethod === "wallet" && "Ví điện tử"}
                </span>
              </div>
            </div>

            {/* Cash Payment */}
            {selectedPaymentMethod === "cash" && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    Vui lòng thu tiền mặt từ khách hàng và xác nhận bên dưới
                  </p>
                </div>
                <button
                  onClick={handleConfirmCashPayment}
                  disabled={loadingTransactions}
                  className={`w-full py-3 rounded-lg text-white font-semibold ${
                    loadingTransactions
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {loadingTransactions ? "Đang xử lý..." : "Xác nhận đã nhận tiền"}
                </button>
              </div>
            )}

            {/* Bank Transfer Payment */}
            {selectedPaymentMethod === "bank_transfer" && (
              <div className="space-y-4">
                {qrCodeUrl ? (
                  <div className="text-center">
                    <p className="text-gray-700 mb-3">
                      Quét mã QR để thanh toán
                    </p>
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="mx-auto border rounded-lg"
                    />
                    <p className="text-sm text-gray-500 mt-3">
                      Đang chờ xác nhận thanh toán...
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Đang tạo mã QR...</p>
                  </div>
                )}
              </div>
            )}

            {/* Wallet Payment */}
            {selectedPaymentMethod === "wallet" && (
              <div className="space-y-4">
                {walletPolling ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">
                      Đang chờ xác nhận từ ví điện tử...
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Vui lòng mở ví điện tử và xác nhận thanh toán
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      Vui lòng mở ví điện tử để thanh toán
                    </p>
                  </div>
                )}
              </div>
            )}

            {transactionError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{transactionError}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManager;