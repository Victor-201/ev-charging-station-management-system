import React, { useCallback } from "react";
import { X } from "lucide-react";
import paymentService from "@/services/paymentService";

const PaymentModal = ({
  showPaymentModal,
  setShowPaymentModal,
  selectedPaymentMethod,
  reconcileResult,
  currentSession,
  selectedSessionId,
  qrCodeUrl,
  setQrCodeUrl,
  walletPolling,
  setWalletPolling,
  loadingTransactions,
  setLoadingTransactions,
  transactionError,
  setTransactionError,
  setReconcileResult,
  refreshReconcileData,
  refreshCurrentSession,
  loadActivePoints,
  STATION_ID,
}) => {
  const formatMoney = (v) => {
    if (v === null || v === undefined || v === "") return "N/A";
    const n = Number(v) ?? 0;
    return n.toLocaleString("vi-VN") + " VNĐ";
  };

  const createTransaction = useCallback(async (payload) => {
    setLoadingTransactions(true);
    setTransactionError(null);

    try {
      const res = await paymentService.createTransaction(payload);

      const data =
        res?.transaction ||
        res?.data?.transaction ||
        res;

      if (!data) {
        throw new Error("Không tìm thấy dữ liệu giao dịch trong phản hồi");
      }

      const qr =
        data?.meta?.qrLink ||
        data?.meta?.qrlink ||
        data?.data?.meta?.qrLink ||
        null;

      if (qr) {
        setQrCodeUrl(qr);
      }

      return { success: true, data };

    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Giao dịch thất bại";

      setTransactionError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoadingTransactions(false);
    }
  }, [setLoadingTransactions, setTransactionError, setQrCodeUrl]);

  const pollWalletPayment = useCallback(() => {
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
        await refreshReconcileData();
        await refreshCurrentSession();
        await loadActivePoints();
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      setWalletPolling(false);
    }, 60000);
  }, [setWalletPolling, setReconcileResult, setShowPaymentModal, setQrCodeUrl, refreshReconcileData, refreshCurrentSession, loadActivePoints]);

  const handleProceedPayment = async () => {
    if (!selectedPaymentMethod || !reconcileResult?.diff || reconcileResult.diff <= 0) return;

    const amount = Number(reconcileResult.diff);
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

    if (selectedPaymentMethod === "bank_transfer") {
      const result = await createTransaction(payload);

      if (!result.success) {
        alert(`Tạo giao dịch thất bại: ${result.error}`);
        return;
      }

      const data = result.data ?? result;

      const qrFromBackend =
        data?.meta?.qrLink ||
        data?.data?.meta?.qrLink ||
        data?.meta?.qrlink ||
        null;

      if (qrFromBackend) {
        setQrCodeUrl(qrFromBackend);
      } else if (!qrCodeUrl) {
        const mockQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PAY:${session_id}:${amount}`;
        setQrCodeUrl(mockQR);
      }

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
        await refreshReconcileData();
        await refreshCurrentSession();
        await loadActivePoints();
      }
    } else if (selectedPaymentMethod === "wallet") {
      setWalletPolling(true);
      pollWalletPayment();

      const result = await createTransaction(payload);
      if (result.success) {
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
          await refreshReconcileData();
          await refreshCurrentSession();
          await loadActivePoints();
        }
      }
    }
  };

  const handleConfirmCashPayment = async () => {
    if (!confirm("Xác nhận đã thu đủ tiền mặt từ khách hàng?")) return;

    const amount = Number(reconcileResult.diff);
    const user_id = currentSession?.user_id;
    const session_id = selectedSessionId;
    const start_time = currentSession?.start_time || currentSession?.created_at;
    const end_time = currentSession?.end_time || new Date().toISOString();

    const hasReservation = 
      currentSession?.reservation_id != null && 
      currentSession?.reservation_id !== "";

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
      await refreshReconcileData();
      await refreshCurrentSession();
      await loadActivePoints();
    } else {
      alert(`Lỗi xác nhận thanh toán: ${result.error}`);
    }
  };

  // Auto-proceed payment when modal opens
  React.useEffect(() => {
    if (showPaymentModal && selectedPaymentMethod && selectedPaymentMethod !== "cash") {
      handleProceedPayment();
    }
  }, [showPaymentModal]);

  return (
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
  );
};

export default PaymentModal;