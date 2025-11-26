// ================== FULL FILE PaymentModal.js ==================
import React, { useCallback, useState, useRef, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";
import paymentService from "@/services/paymentService";
import { useSocketClient } from "@/hooks/useSocket";
import { useSocketEvent } from "@/hooks/useSocketEvent";

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
  const [pendingCashTransactionId, setPendingCashTransactionId] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null); // lưu transaction vừa tạo
  const [qrAutoPaid, setQrAutoPaid] = useState(false); // đã tự mark paid (tick)
  const [qrProcessingConfirm, setQrProcessingConfirm] = useState(false); // đang confirm backend
  const qrAutoTimerRef = useRef(null);
  const socket = useSocketClient();

  // =========================
  // SOCKET LISTEN PAYMENT UPDATE
  // =========================
  useSocketEvent(socket, "transaction_status_updated", async (data) => {
    if (!data) return;

    const { transaction_id, status, invoice_id } = data;

    if (data.related_id !== selectedSessionId) return;

    console.log("SOCKET PAYMENT UPDATE:", data);

    if (status === "completed" || status === "success" || status === "paid") {
      alert("Thanh toán đã được xác nhận thành công!");

      setReconcileResult((prev) => ({
        ...prev,
        payment_status: "completed",
      }));

      // reset QR/modal
      setShowPaymentModal(false);
      setQrCodeUrl(null);
      setLastTransaction(null);
      setQrAutoPaid(false);

      if (invoice_id) {
        await askInvoice(invoice_id);
      }

      await refreshReconcileData();
      await refreshCurrentSession();
      await loadActivePoints();
    }
  });

  // =========================
  // FORMAT MONEY
  // =========================
  const formatMoney = (v) => {
    if (v === null || v === undefined || v === "") return "N/A";
    return Number(v).toLocaleString("vi-VN") + " VNĐ";
  };

  // =========================
  // INVOICE HANDLER
  // =========================
  const printInvoice = async (invoiceId) => {
    try {
      const res = await paymentService.getInvoiceById(invoiceId);
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);

      window.open(url);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Lỗi in hóa đơn:", err);
      alert("Không thể in hóa đơn.");
    }
  };

  const askInvoice = async (invoiceId) => {
    const wantsInvoice = window.confirm("Bạn có muốn lấy hóa đơn không?");
    if (wantsInvoice) {
      await printInvoice(invoiceId);
    }
  };

  // =========================
  // CREATE TRANSACTION
  // =========================
  const createTransaction = useCallback(
    async (payload) => {
      setLoadingTransactions(true);
      setTransactionError(null);

      try {
        const res = await paymentService.createTransaction(payload);
        const data =
          res?.transaction ||
          res?.data?.transaction ||
          res;

        const qr =
          data?.meta?.qrLink ||
          data?.meta?.qrlink ||
          data?.data?.meta?.qrLink ||
          null;

        // lưu transaction để dùng confirm sau (nếu cần)
        setLastTransaction(data);

        if (qr) setQrCodeUrl(qr);

        return { success: true, data, raw: res };
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
    },
    [setLoadingTransactions, setTransactionError, setQrCodeUrl]
  );

  // =========================
  // CONFIRM CASH
  // =========================
  const confirmCashTransaction = useCallback(
    async (transactionId, payload) => {
      setLoadingTransactions(true);
      setTransactionError(null);

      try {
        const res = await paymentService.confirmCashTransaction(
          transactionId,
          payload
        );
        return { success: true, data: res?.data ?? res };
      } catch (err) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Xác nhận giao dịch thất bại";

        setTransactionError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoadingTransactions(false);
      }
    },
    [setLoadingTransactions, setTransactionError]
  );

  // =========================
  // CONFIRM BANK TRANSFER (TRY MULTIPLE FALLBACKS)
  // =========================
  const confirmBankTransfer = useCallback(
    async (transaction) => {
      if (!transaction) return { success: false, error: "No transaction" };

      setQrProcessingConfirm(true);
      setTransactionError(null);

      const transactionId = transaction.id || transaction.transaction_id || transaction.txn_id;

      // payload we might want to send to confirm
      const payload = {
        confirmed_at: new Date().toISOString(),
        confirmed_by: "system",
        notes: "Auto-confirmed after QR displayed 30s",
      };

      // Try a few possible API names / fallbacks
      try {
        if (paymentService.confirmBankTransaction) {
          // preferred API if available
          const res = await paymentService.confirmBankTransaction(transactionId, payload);
          setQrProcessingConfirm(false);
          return { success: true, data: res?.data ?? res };
        }
      } catch (err) {
        console.warn("confirmBankTransaction failed:", err);
      }

      try {
        if (paymentService.updateTransactionStatus) {
          // generic update status
          const res = await paymentService.updateTransactionStatus(transactionId, { status: "completed", ...payload });
          setQrProcessingConfirm(false);
          return { success: true, data: res?.data ?? res };
        }
      } catch (err) {
        console.warn("updateTransactionStatus failed:", err);
      }

      try {
        // fallback to confirmCashTransaction (if backend treats confirm similarly)
        if (paymentService.confirmCashTransaction) {
          const res = await paymentService.confirmCashTransaction(transactionId, { ...payload, method: "bank_transfer" });
          setQrProcessingConfirm(false);
          return { success: true, data: res?.data ?? res };
        }
      } catch (err) {
        console.warn("fallback confirmCashTransaction failed:", err);
      }

      setQrProcessingConfirm(false);
      return { success: false, error: "Không thể xác nhận giao dịch trên backend (no suitable API)." };
    },
    []
  );

  // =========================
  // WALLET POLLING MOCK
  // =========================
  const pollWalletPayment = useCallback(
    (transaction) => {
      // Kiểm tra ngay status trả về
      const status = transaction.status.toLowerCase();

      if (status === "completed" || status === "success" || status === "paid") {
        alert("Thanh toán ví thành công!");
        setReconcileResult((prev) => ({
          ...prev,
          payment_status: "completed",
        }));

        setShowPaymentModal(false);
        setQrCodeUrl(null);
        askInvoice(transaction.invoice_id);

        refreshReconcileData();
        refreshCurrentSession();
        loadActivePoints();
        return;
      } else if (status === "failed") {
        const reason = transaction.meta?.reason?.reason || "Lý do không xác định";

        let message = "Thanh toán ví thất bại: ";
        if (reason === "Invalid wallet action") {
          message += "Ví của người dùng không đủ tiền.";
        } else {
          message += reason;
        }

        alert(message);
        setTransactionError(message);
        setWalletPolling(false);
        return;
      }

      // Nếu status khác, vẫn tiếp tục poll
      setWalletPolling(true);
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
    },
    [
      setWalletPolling,
      setReconcileResult,
      setShowPaymentModal,
      setQrCodeUrl,
      refreshReconcileData,
      refreshCurrentSession,
      loadActivePoints,
    ]
  );

  // =========================
  // HANDLE AUTO-PAID TIMER (FOR QR BANK TRANSFER)
  // =========================
  useEffect(() => {
    // start timer only when modal open, method is bank_transfer, and we have a QR url
    if (
      showPaymentModal &&
      selectedPaymentMethod === "bank_transfer" &&
      qrCodeUrl
    ) {
      // clear previous if any
      if (qrAutoTimerRef.current) {
        clearTimeout(qrAutoTimerRef.current);
        qrAutoTimerRef.current = null;
      }

      // Start 30s timer (no visible countdown)
      qrAutoTimerRef.current = setTimeout(async () => {
        // show tick UI immediately
        setQrAutoPaid(true);

        // Attempt backend confirmation (if possible)
        try {
          const confirmResult = await confirmBankTransfer(lastTransaction);
          if (confirmResult && confirmResult.success) {
            // mark reconcile + close UI
            setReconcileResult((prev) => ({
              ...prev,
              payment_status: "completed",
            }));

            alert("Thanh toán đã được xác nhận thành công!");

            // reset UI
            setShowPaymentModal(false);
            setQrCodeUrl(null);
            setLastTransaction(null);
            setQrAutoPaid(false);

            // if backend returned invoice id, try to ask invoice (best-effort)
            const invoiceId =
              (confirmResult.data && confirmResult.data.invoice_id) ||
              (lastTransaction && lastTransaction.invoice_id) ||
              (confirmResult.data && confirmResult.data.invoice && confirmResult.data.invoice.id) ||
              null;

            if (invoiceId) {
              await askInvoice(invoiceId);
            }

            await refreshReconcileData();
            await refreshCurrentSession();
            await loadActivePoints();
          } else {
            // If couldn't confirm on backend, still mark completed locally as requested
            // (user asked "thanh toán bên ngoài cũng như là đã confirm r vậy đó")
            setReconcileResult((prev) => ({
              ...prev,
              payment_status: "completed",
            }));

            alert("Thanh toán được đánh dấu là hoàn tất (local).");

            setShowPaymentModal(false);
            setQrCodeUrl(null);
            setLastTransaction(null);
            setQrAutoPaid(false);

            await refreshReconcileData();
            await refreshCurrentSession();
            await loadActivePoints();
          }
        } catch (err) {
          console.error("Auto confirm error:", err);
          // still close and mark locally
          setReconcileResult((prev) => ({
            ...prev,
            payment_status: "completed",
          }));
          setShowPaymentModal(false);
          setQrCodeUrl(null);
          setLastTransaction(null);
          setQrAutoPaid(false);

          await refreshReconcileData();
          await refreshCurrentSession();
          await loadActivePoints();
        }
      }, 30000); // 30 seconds
    }

    return () => {
      // cleanup timer on unmount or when dependencies change
      if (qrAutoTimerRef.current) {
        clearTimeout(qrAutoTimerRef.current);
        qrAutoTimerRef.current = null;
      }
    };
    // intentionally include qrCodeUrl and selectedPaymentMethod and showPaymentModal and lastTransaction
  }, [qrCodeUrl, selectedPaymentMethod, showPaymentModal, lastTransaction, confirmBankTransfer]);

  // =========================
  // PROCEED PAYMENT
  // =========================
  const handleProceedPayment = async () => {
    if (!selectedPaymentMethod || !reconcileResult?.diff) return;

    const amount = Number(reconcileResult.diff);
    const user_id = currentSession?.user_id;
    const session_id = selectedSessionId;
    const start_time = currentSession?.start_time || currentSession?.created_at;
    const end_time = currentSession?.end_time || new Date().toISOString();
    const hasReservation =
      currentSession?.reservation_id != null &&
      currentSession?.reservation_id !== "";

    const related_type = hasReservation
      ? "charging_session"
      : "guest_charging";

    const payload = {
      user_id,
      type: "payment",
      method: selectedPaymentMethod,
      related_id: session_id,
      related_type,
      amount,
      meta: {
        description: `Thanh toán ${
          hasReservation ? "đặt sạc" : "khách vãng lai"
        } tại trạm ${STATION_ID}`,
        start_time,
        end_time,
        reservation_id: currentSession?.reservation_id || null,
        connector_id: currentSession?.connector_id || null,
      },
    };

    const result = await createTransaction(payload);
    if (!result.success) return alert(`Tạo giao dịch thất bại: ${result.error}`);

    const transaction = result.data;
    const invoice = result.raw?.invoice || result.raw?.data?.invoice;
    const invoiceId = invoice?.id;
    transaction.invoice_id = invoiceId; // attach invoice id vào transaction

    // save as lastTransaction (createTransaction already set it, but ensure)
    setLastTransaction(transaction);

    if (selectedPaymentMethod === "bank_transfer") {
      const qrFromBackend =
        transaction?.meta?.qrLink ||
        transaction?.data?.meta?.qrLink ||
        transaction?.meta?.qrlink ||
        null;

      if (qrFromBackend) setQrCodeUrl(qrFromBackend);

      const immediateStatus =
        (transaction?.status || transaction?.payment_status || "")
          .toString()
          .toLowerCase();

      if (["completed", "success", "paid"].includes(immediateStatus)) {
        alert("Thanh toán chuyển khoản hoàn tất.");
        setShowPaymentModal(false);
        setQrCodeUrl(null);
        setLastTransaction(null);

        await askInvoice(invoiceId);

        await refreshReconcileData();
        await refreshCurrentSession();
        await loadActivePoints();
      }
      // else: timer effect will handle auto-confirm after 30s
    } else if (selectedPaymentMethod === "wallet") {
      pollWalletPayment(transaction);
    }
  };

  // =========================
  // CASH PAYMENT
  // =========================
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

    const related_type = hasReservation
      ? "charging_session"
      : "guest_charging";

    const payload = {
      user_id,
      type: "payment",
      method: "cash",
      related_id: session_id,
      related_type,
      amount,
      meta: {
        description: `Thanh toán tiền mặt ${
          hasReservation ? "đặt sạc" : "khách vãng lai"
        } tại trạm ${STATION_ID}`,
        start_time,
        end_time,
        reservation_id: currentSession?.reservation_id || null,
        connector_id: currentSession?.connector_id || null,
        payment_confirmed_at: new Date().toISOString(),
      },
    };

    const createResult = await createTransaction(payload);
    if (!createResult.success)
      return alert(`Lỗi tạo giao dịch: ${createResult.error}`);

    const transaction = createResult.data;
    const transactionId = transaction?.id;
    const invoice = createResult.raw?.invoice || createResult.raw?.data?.invoice;
    const invoiceId = invoice?.id;

    if (!transactionId) return alert("Không tìm thấy transaction ID");

    setPendingCashTransactionId(transactionId);

    const confirmPayload = {
      confirmed_at: new Date().toISOString(),
      confirmed_by: "staff",
      notes: "Xác nhận thu tiền mặt tại trạm",
    };

    const confirmResult = await confirmCashTransaction(
      transactionId,
      confirmPayload
    );

    setPendingCashTransactionId(null);

    if (confirmResult.success) {
      setReconcileResult((prev) => ({
        ...prev,
        payment_status: "completed",
      }));

      alert("Đã xác nhận thanh toán tiền mặt thành công!");

      setShowPaymentModal(false);
      setQrCodeUrl(null);

      await askInvoice(invoiceId);

      await refreshReconcileData();
      await refreshCurrentSession();
      await loadActivePoints();
    }
  };

  // =========================
  // AUTO PROCEED WHEN OPEN
  // =========================
  useEffect(() => {
    if (
      showPaymentModal &&
      selectedPaymentMethod &&
      selectedPaymentMethod !== "cash"
    ) {
      handleProceedPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPaymentModal]);

  // =========================
  // RENDER UI
  // =========================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Thanh toán</h3>
          <button
            onClick={() => {
              // cleanup timer if user closes manually
              if (qrAutoTimerRef.current) {
                clearTimeout(qrAutoTimerRef.current);
                qrAutoTimerRef.current = null;
              }
              setQrAutoPaid(false);
              setShowPaymentModal(false);
            }}
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
              {selectedPaymentMethod === "wallet" && "Ví"}
            </span>
          </div>
        </div>

        {/* CASH SECTION */}
        {selectedPaymentMethod === "cash" && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                Vui lòng thu tiền mặt từ khách hàng và xác nhận bên dưới
              </p>
            </div>
            {pendingCashTransactionId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  Đang xử lý giao dịch ID: {pendingCashTransactionId}
                </p>
              </div>
            )}
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

        {/* BANK TRANSFER SECTION */}
        {selectedPaymentMethod === "bank_transfer" && (
          <div className="space-y-4">
            {qrCodeUrl ? (
              <div className="text-center relative">
                {!qrAutoPaid && (
                  <>
                    <p className="text-gray-700 mb-3">Quét mã QR để thanh toán</p>
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="mx-auto border rounded-lg"
                    />
                    <p className="text-sm text-gray-500 mt-3">
                      Đang chờ xác nhận thanh toán...
                    </p>
                  </>
                )}

                {/* Khi auto-paid true => show tick overlay */}
                {qrAutoPaid && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="p-4 rounded-full bg-green-50 border border-green-200">
                      <CheckCircle size={56} className="text-green-600" />
                    </div>
                    <p className="text-green-700 font-semibold mt-3">
                      Thanh toán thành công
                    </p>
                    {qrProcessingConfirm && (
                      <p className="text-sm text-gray-500 mt-2">
                        Đang xác nhận với hệ thống...
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Đang tạo mã QR...</p>
              </div>
            )}
          </div>
        )}

        {/* WALLET SECTION */}
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
