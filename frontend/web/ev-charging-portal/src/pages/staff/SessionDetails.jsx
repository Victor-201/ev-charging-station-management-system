import React, { useState, useEffect, useCallback } from "react";
import { Pause, Play, Square, RefreshCw, DollarSign, CheckCircle } from "lucide-react";
import paymentService from "@/services/paymentService";
import chargingControlService from "@/services/chargingControlService";
import userService from "@/services/userService";
import {
  formatMoney, getStatusColor, TelemetrySection, SessionEventsSection,
  PaymentSection, ReconcileDetailsSection
} from "./SessionDetailsComponents";

const SessionDetails = ({
  selectedSessionId,
  currentSession,
  telemetry,
  sessionEvents,
  reconcileResult,
  loadingSession,
  loadingReconcile,
  loadingRefund,
  autoRefresh,
  setAutoRefresh,
  refreshCurrentSession,
  pauseSession,
  resumeSession,
  stopSession,
  getInvoiceBySession,
  reconcileSession,
  setReconcileResult,
  setLoadingReconcile,
  loadActivePoints,
  refreshReconcileData,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  setShowPaymentModal,
  STATION_ID,
  setLoadingRefund,
  setTransactionError,
}) => {
  const [reservationDetail, setReservationDetail] = useState(null);
  const [loadingReservation, setLoadingReservation] = useState(false);
  const [reservationError, setReservationError] = useState(null);

  // states để hiển thị tên người dùng khi có reservation
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);

  const isGuestSession = !currentSession?.reservation_id || currentSession?.reservation_id === "";

  const isSessionCompleted = ["confirmed", "completed", "stopped"].includes(currentSession?.status);

  // --- Fetch reservation by ID ---
  const getReservationById = useCallback(async (reservation_id) => {
    if (!reservation_id) return;
    setLoadingReservation(true);
    setReservationError(null);
    try {
      const res = await chargingControlService.getReservationById(reservation_id);
      const data = res?.data ?? res;
      setReservationDetail(data);
    } catch (err) {
      setReservationError(err);
      console.error("Lỗi lấy reservation:", err);
      setReservationDetail(null);
    } finally {
      setLoadingReservation(false);
    }
  }, []);

  // --- Fetch user by id (dùng khi có reservation) ---
  const fetchUserById = useCallback(async (userId) => {
    if (!userId) {
      setSelectedUser(null);
      return null;
    }
    setLoadingUser(true);
    setUserError(null);
    try {
      const data = await userService.getUserById(userId);
      // Giả sử API trả về object user với trường "name" hoặc "full_name"
      setSelectedUser(data ?? null);
      setLoadingUser(false);
      return data;
    } catch (err) {
      setUserError(err);
      setSelectedUser(null);
      setLoadingUser(false);
      console.error("Lỗi lấy user:", err);
      return null;
    }
  }, []);

  // Khi có reservation_id trong session, tự động fetch reservation
  useEffect(() => {
    if (currentSession?.reservation_id) {
      getReservationById(currentSession.reservation_id);
    } else {
      setReservationDetail(null);
      setSelectedUser(null); // ẩn user nếu không đặt trước
    }
  }, [currentSession?.reservation_id, getReservationById]);

  // Khi reservationDetail thay đổi và có user_id -> fetch user name
  useEffect(() => {
    const userId = reservationDetail?.user_id || reservationDetail?.userId || reservationDetail?.user?.id;
    if (userId) {
      fetchUserById(userId);
    } else {
      setSelectedUser(null);
    }
  }, [reservationDetail, fetchUserById]);

  // --- Session controls ---
  const handlePause = async () => {
    if (!selectedSessionId) return;
    const result = await pauseSession(selectedSessionId);
    if (result?.success) {
      await refreshCurrentSession();
      await loadActivePoints();
    }
  };

  const handleResume = async () => {
    if (!selectedSessionId) return;
    const result = await resumeSession(selectedSessionId);
    if (result?.success) {
      await refreshCurrentSession();
      await loadActivePoints();
    }
  };

  const handleStop = async () => {
    if (!selectedSessionId) return;
    if (!confirm("Bạn có chắc muốn dừng phiên sạc này?")) return;
    const result = await stopSession({ session_id: selectedSessionId });
    if (result?.success || result?.ok) {
      await refreshCurrentSession();
      await loadActivePoints();
      await handleReconcile();
    }
  };

  // --- Reconcile / payment ---
  const handleReconcile = async () => {
    if (!selectedSessionId) return;
    setLoadingReconcile(true);
    try {
      const result = await reconcileSession(selectedSessionId, {});
      let reconcileData = null;

      if (result?.ok && result?.result) {
        const apiResult = result.result;
        reconcileData = {
          session_id: apiResult.session_id,
          session_cost: apiResult.session_cost,
          reserved_cost: apiResult.reserved_cost,
          diff: apiResult.diff,
          settlement: apiResult.settlement,
          reserved: apiResult.reserved_cost,
          actual: apiResult.session_cost,
          action: apiResult.settlement?.type || "none",
          settlement_message: apiResult.settlement?.message || "",
          settlement_amount: apiResult.settlement?.amount,
          payment_status: isSessionCompleted ? "completed" : (apiResult.diff > 0 ? "pending" : (apiResult.diff < 0 ? "pending" : "completed")),
          autoSettled: false,
        };
      } else if (result?.success && result?.data) {
        const data = result.data?.result || result.data;
        reconcileData = {
          session_id: data.session_id,
          session_cost: data.session_cost,
          reserved_cost: data.reserved_cost,
          diff: data.diff,
          settlement: data.settlement,
          reserved: data.reserved_cost || data.reserved,
          actual: data.session_cost || data.actual,
          action: data.settlement?.type || data.action || "none",
          settlement_message: data.settlement?.message || data.note || "",
          settlement_amount: data.settlement?.amount,
          payment_status: isSessionCompleted ? "completed" : (data.payment_status || (data.diff > 0 ? "pending" : "completed")),
          autoSettled: false,
        };
      } else if (result?.result) {
        const data = result.result;
        reconcileData = {
          session_id: data.session_id,
          session_cost: data.session_cost,
          reserved_cost: data.reserved_cost,
          diff: data.diff,
          settlement: data.settlement,
          reserved: data.reserved_cost,
          actual: data.session_cost,
          action: data.settlement?.type || "none",
          settlement_message: data.settlement?.message || "",
          settlement_amount: data.settlement?.amount,
          payment_status: isSessionCompleted ? "completed" : (data.diff > 0 ? "pending" : (data.diff < 0 ? "pending" : "completed")),
          autoSettled: false,
        };
      }

      if (reconcileData) {
        setReconcileResult(reconcileData);
        await refreshCurrentSession();
      } else {
        await handleFallbackInvoice();
      }
    } catch (e) {
      console.error("Error reconcile:", e);
      await handleFallbackInvoice();
    } finally {
      setLoadingReconcile(false);
    }
  };

  const handleFallbackInvoice = async () => {
    try {
      const invoiceResult = await getInvoiceBySession(selectedSessionId);
      const invoiceData = invoiceResult?.data ?? invoiceResult;
      const finalCost = invoiceData?.total_cost ?? invoiceData?.cost ?? currentSession?.cost ?? 0;
      const hasReservation = currentSession?.reservation_id != null && currentSession?.reservation_id !== "";
      setReconcileResult({
        session_id: selectedSessionId,
        session_cost: finalCost,
        reserved_cost: 0,
        diff: finalCost,
        settlement: {
          type: finalCost > 0 ? "charge" : "none",
          amount: finalCost,
          message: hasReservation ? "Điều chỉnh thanh toán (fallback)" : "Thanh toán toàn bộ (fallback)"
        },
        reserved: 0,
        actual: finalCost,
        action: finalCost > 0 ? "charge" : "none",
        payment_status: isSessionCompleted ? "completed" : "pending",
        autoSettled: false,
        settlement_message: hasReservation ? "Điều chỉnh thanh toán (fallback)" : "Thanh toán toàn bộ (fallback)",
      });
    } catch (fallbackError) {
      console.error("Error fallback invoice:", fallbackError);
      alert("Không thể lấy thông tin thanh toán");
    }
  };

  const handleSelectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
    setTransactionError(null);
  };

  const handleProceedPayment = () => {
    if (!selectedPaymentMethod || !reconcileResult?.diff || reconcileResult.diff <= 0) return;
    setShowPaymentModal(true);
  };

  const handleRefund = async () => {
    if (!reconcileResult || reconcileResult.action !== "refund") return;
    if (!confirm("Bạn có chắc muốn thực hiện hoàn tiền cho khách hàng?")) return;

    const refundAmount = Math.abs(Number(reconcileResult.diff));
    const user_id = currentSession?.user_id;
    const session_id = selectedSessionId;
    const start_time = currentSession?.start_time || currentSession?.created_at;
    const end_time = currentSession?.end_time || new Date().toISOString();
    const hasReservation = currentSession?.reservation_id != null && currentSession?.reservation_id !== "";
    const related_type = hasReservation ? "charging_session" : "guest_charging";

    if (!user_id || !session_id) {
      alert("Thiếu thông tin người dùng hoặc phiên sạc");
      return;
    }

    const payload = {
      user_id,
      type: "refund",
      method: "wallet",
      related_id: session_id,
      related_type,
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
    paymentService.createTransaction(payload)
      .then((res) => {
        const data = res?.transaction || res?.data?.transaction || res;
        if (data) {
          setReconcileResult((prev) => ({ ...prev, payment_status: "refunded" }));
          alert("Hoàn tiền thành công!");
          handleReconcile();
          refreshCurrentSession();
          loadActivePoints();
        }
      })
      .catch((err) => {
        const errorMsg = err?.response?.data?.message || err?.message || "Lỗi hoàn tiền";
        alert(`Lỗi hoàn tiền: ${errorMsg}`);
      })
      .finally(() => { setLoadingRefund(false); });
  };

  const handleRefreshReconcile = async () => { await handleReconcile(); };

  const isPendingPayment = !isSessionCompleted &&
    reconcileResult?.payment_status === "pending" &&
    ["charge", "charge_due"].includes(reconcileResult?.action) &&
    Number(reconcileResult?.diff) > 0;

  const isRefundable = !isSessionCompleted &&
    reconcileResult?.action === "refund" &&
    Number(reconcileResult?.diff) < 0 &&
    reconcileResult?.payment_status !== "refunded";

  // Helper để hiển thị tên user (ưu tiên selectedUser.name, fallback user_id)
  const renderUserDisplay = () => {
    // chỉ hiện khi session có reservation
    if (!currentSession?.reservation_id) return null;

    if (loadingUser) {
      return <p className="text-sm text-gray-500">Đang tải thông tin người dùng...</p>;
    }

    if (userError) {
      return <p className="text-sm text-red-500">Không thể lấy tên người dùng</p>;
    }

    const name = selectedUser?.name || selectedUser?.full_name || selectedUser?.displayName || selectedUser?.username;
    if (name) {
      return <p className="font-medium">{name}</p>;
    }

    // nếu không có tên thì fallback show id (ít khả năng xảy ra nhưng an toàn)
    return <p className="font-mono text-sm">{currentSession.user_id || "N/A"}</p>;
  };

  return (
    <>
      {/* PHẦN CHI TIẾT PHIÊN SẠC */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Chi Tiết Phiên Sạc</h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded" />
              Auto refresh
            </label>
            <button onClick={refreshCurrentSession} disabled={loadingSession}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm">
              <RefreshCw size={14} className={loadingSession ? "animate-spin" : ""} />
              Refresh
            </button>
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

              {/* Hiển thị tên người dùng khi có reservation, nếu không thì ẩn */}
              {currentSession?.reservation_id ? (
                <div>
                  <p className="text-sm text-gray-600">Người đặt / User</p>
                  {renderUserDisplay()}
                </div>
              ) : null}

              <div>
                <p className="text-sm text-gray-600">Connector</p>
                <p className="font-medium">{currentSession.connector_id || "N/A"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Thời gian đặt lịch</p>
                <p className="font-medium">
                  {currentSession.reservation_id ? "Đã đặt trước" : "Không có (khách vãng lai)"}
                </p>

                {loadingReservation && (
                  <span className="text-sm text-gray-500 ml-2">Đang tải chi tiết đặt trước...</span>
                )}

                {reservationDetail && (
                  <div className="text-sm text-gray-700 mt-1 space-y-1">
                    <p>
                      Bắt đầu:{" "}
                      {new Date(reservationDetail.start_time).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                    <p>
                      Kết thúc:{" "}
                      {new Date(reservationDetail.end_time).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600">Loại phiên</p>
                <p className="font-medium">{currentSession.reservation_id ? "Đặt trước" : "Khách vãng lai"}</p>
              </div>
            </div>

            {/* CÁC NÚT ĐIỀU KHIỂN */}
            {!isSessionCompleted && (
              <div className="flex gap-3 pt-4 border-t flex-wrap">
                {(currentSession.status === "active" || currentSession.status === "charging") && (
                  <button onClick={handlePause} disabled={loadingSession}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50">
                    <Pause size={18} /> Tạm dừng
                  </button>
                )}
                {currentSession.status === "paused" && (
                  <button onClick={handleResume} disabled={loadingSession}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    <Play size={18} /> Tiếp tục
                  </button>
                )}
                {(currentSession.status === "active" || currentSession.status === "charging" || currentSession.status === "paused") && (
                  <button onClick={handleStop} disabled={loadingSession}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                    <Square size={18} /> Dừng sạc
                  </button>
                )}
              </div>
            )}

            {/* Nút xem hóa đơn / reconcile */}
            <div className="flex gap-3 pt-4 border-t flex-wrap">
              <button onClick={() => getInvoiceBySession(selectedSessionId)} disabled={loadingSession}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <DollarSign size={18} /> Xem hóa đơn
              </button>
              <button onClick={handleReconcile} disabled={loadingReconcile}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold">
                {loadingReconcile ? (<><RefreshCw size={18} className="animate-spin" /> Đang xử lý...</>) : (<>💳 Xem chi tiết thanh toán</>)}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thông tin thanh toán */}
      {(reconcileResult || loadingReconcile) && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              💰 Thông Tin Thanh Toán / Điều Chỉnh
              {isSessionCompleted && reconcileResult && (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <CheckCircle size={16} />
                  Đã thanh toán
                </span>
              )}
            </h3>
            <button onClick={handleRefreshReconcile} disabled={loadingReconcile}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm">
              <RefreshCw size={14} className={loadingReconcile ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
          
          {loadingReconcile ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="animate-spin text-purple-600 mr-2" />
              <p className="text-gray-600">Đang lấy thông tin thanh toán từ API...</p>
            </div>
          ) : (
            <>
              <ReconcileDetailsSection reconcileResult={reconcileResult} selectedSessionId={selectedSessionId} />
              {!isSessionCompleted ? (
                <PaymentSection
                  reconcileResult={reconcileResult} 
                  isPendingPayment={isPendingPayment}
                  isRefundable={isRefundable} 
                  isGuestSession={isGuestSession}
                  selectedPaymentMethod={selectedPaymentMethod}
                  handleSelectPaymentMethod={handleSelectPaymentMethod}
                  handleProceedPayment={handleProceedPayment}
                  handleRefund={handleRefund} 
                  loadingRefund={loadingRefund}
                />
              ) : (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle size={20} />
                    <p className="font-medium">Phiên sạc đã hoàn thành và thanh toán thành công</p>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Không thể thực hiện thêm giao dịch cho phiên này.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <TelemetrySection telemetry={telemetry} />
      <SessionEventsSection sessionEvents={sessionEvents} />
    </>
  );
};

export default SessionDetails;
