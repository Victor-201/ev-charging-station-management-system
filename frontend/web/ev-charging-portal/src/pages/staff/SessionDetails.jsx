import React from "react";
import {
  Pause,
  Play,
  Square,
  RefreshCw,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowLeftRight,
} from "lucide-react";
import paymentService from "@/services/paymentService";

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
  const isGuestSession = !currentSession?.reservation_id || currentSession?.reservation_id === "";

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
    if (result?.success) {
      await refreshCurrentSession();
      await loadActivePoints();
      await getInvoiceBySession(selectedSessionId);

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
        console.error("Error loading payment info after stop:", e);
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
      await refreshCurrentSession();
    }
  };

  const handleRefreshReconcile = async () => {
    await refreshReconcileData();
    await refreshCurrentSession();
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

    const hasReservation = 
      currentSession?.reservation_id != null && 
      currentSession?.reservation_id !== "";

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
    
    paymentService.createTransaction(payload)
      .then((res) => {
        const data = res?.transaction || res?.data?.transaction || res;
        if (data) {
          setReconcileResult((prev) => ({ 
            ...prev, 
            payment_status: "refunded" 
          }));
          alert("Hoàn tiền thành công!");
          refreshReconcileData();
          refreshCurrentSession();
          loadActivePoints();
        }
      })
      .catch((err) => {
        const errorMsg = err?.response?.data?.message || err?.message || "Lỗi hoàn tiền";
        alert(`Lỗi hoàn tiền: ${errorMsg}`);
      })
      .finally(() => {
        setLoadingRefund(false);
      });
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
            <button
              onClick={refreshCurrentSession}
              disabled={loadingSession}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
            >
              <RefreshCw
                size={14}
                className={loadingSession ? "animate-spin" : ""}
              />
              Refresh
            </button>
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
                  onClick={() => getInvoiceBySession(selectedSessionId)}
                  disabled={loadingSession}
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Thông Tin Thanh Toán / Điều Chỉnh
            </h3>
            <button
              onClick={handleRefreshReconcile}
              disabled={loadingReconcile}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
            >
              <RefreshCw
                size={14}
                className={loadingReconcile ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
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

              {isPendingPayment && (
                <div className="pt-4 border-t">
                  <p className="text-gray-700 font-semibold mb-3">
                    Chọn phương thức thanh toán:
                  </p>
                  <div className={`grid ${isGuestSession ? 'grid-cols-2' : 'grid-cols-3'} gap-3 mb-4`}>
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

                    {!isGuestSession && (
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
                    )}
                  </div>

                  {isGuestSession && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-blue-800 text-sm">
                        ℹ️ Khách vãng lai chỉ có thể thanh toán bằng tiền mặt hoặc chuyển khoản
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleProceedPayment}
                    disabled={!selectedPaymentMethod}
                    className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 ${
                      !selectedPaymentMethod
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    <DollarSign size={20} />
                    Tiến hành thanh toán
                  </button>
                </div>
              )}

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

              {reconcileResult?.payment_status === "completed" && (
                <div className="flex items-center justify-center gap-2 text-green-600 py-3 bg-green-50 rounded-lg">
                  <CheckCircle size={24} />
                  <span className="font-semibold text-lg">
                    Đã thanh toán thành công
                  </span>
                </div>
              )}

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
  );
};

export default SessionDetails;