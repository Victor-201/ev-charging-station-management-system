// contexts/PaymentProvider.jsx
import React, { useState, useCallback, useMemo } from "react";
import { PaymentContext } from "@/contexts/PaymentContext";
import paymentService from "@/services/paymentService";

export const PaymentProvider = ({ children }) => {
  const [error, setError] = useState(null);

  // LOADING STATES
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState({
    daily: false,
    monthly: false,
    summary: false,
    today: false,
    all: false,
  });

  // CACHED STATES
  const [lastPayment, setLastPayment] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  const [dailyRevenue, setDailyRevenue] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(null);
  const [todayRevenue, setTodayRevenue] = useState(null);
  const [summaryRevenue, setSummaryRevenue] = useState(null);

  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [transactionPolling, setTransactionPolling] = useState(false);

  // =====================================================
  // TRANSACTIONS
  // =====================================================
  const createTransaction = useCallback(async (payload) => {
    setLoadingTransactions(true);
    setError(null);

    try {
      const res = await paymentService.createTransaction(payload);
      const data = res?.data ?? res;

      const qr =
        data?.meta?.qrLink || data?.data?.meta?.qrLink || null;
      if (qr) setQrCodeUrl(qr);

      setLastPayment(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingTransactions(false);
    }
  }, []);
    // =====================================================
  // INVOICE (PDF)
  // =====================================================
  const getInvoiceById = useCallback(async (invoiceId) => {
    setLoadingInvoice(true);
    setError(null);

    try {
      const res = await paymentService.getInvoiceById(invoiceId);

      // API trả về blob PDF
      const blob = res?.data instanceof Blob ? res.data : new Blob([res], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Mở tab mới xem PDF
      window.open(url);

      // Tạo link download
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Lưu lại invoice cuối cùng
      setLastInvoice(invoiceId);

      return { success: true };
    } catch (err) {
      const e = err?.response?.data ?? err;
      console.error("Invoice Error:", e);
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingInvoice(false);
    }
  }, []);


  const confirmCashTransaction = useCallback(async (transactionId, payload) => {
    setLoadingTransactions(true);
    setError(null);

    try {
      const res = await paymentService.confirmCashTransaction(
        transactionId,
        payload
      );
      const data = res?.data ?? res;
      setLastPayment(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  const getTransaction = useCallback(async (transactionId) => {
    if (!transactionId)
      return { success: false, error: "transactionId is required" };

    if (typeof paymentService.getTransaction !== "function")
      return { success: false, error: "getTransaction not implemented" };

    setLoadingTransactions(true);
    setError(null);

    try {
      const res = await paymentService.getTransaction(transactionId);
      const data = res?.data ?? res;

      const qr =
        data?.meta?.qrLink || data?.data?.meta?.qrLink || null;
      if (qr) setQrCodeUrl(qr);

      setLastPayment(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  // POLLING
  const pollTransactionStatus = useCallback(
    (
      transactionId,
      { intervalMs = 3000, timeoutMs = 120000 } = {}
    ) => {
      if (!transactionId)
        return Promise.resolve({
          success: false,
          error: "transactionId is required",
        });

      setTransactionPolling(true);

      return new Promise((resolve) => {
        const start = Date.now();

        const checkStatus = async () => {
          if (Date.now() - start > timeoutMs) {
            setTransactionPolling(false);
            resolve({ success: false, error: "timeout" });
            return;
          }

          try {
            const res = await paymentService.getTransaction(transactionId);
            const tx = res?.data ?? res;

            const status =
              tx?.status ||
              tx?.data?.status ||
              tx?.payment_status ||
              tx?.data?.payment_status;

            if (["completed", "success", "paid"].includes(String(status).toLowerCase())) {
              setTransactionPolling(false);
              setLastPayment(tx);
              resolve({ success: true, data: tx });
              return;
            }

            if (["failed", "cancelled", "error"].includes(String(status).toLowerCase())) {
              setTransactionPolling(false);
              setLastPayment(tx);
              resolve({ success: false, error: "transaction_failed", data: tx });
              return;
            }
          } catch (_) {}

          setTimeout(checkStatus, intervalMs);
        };

        checkStatus();
      });
    },
    []
  );

  // =====================================================
  // PAYMENTS
  // =====================================================
  const createIntent = useCallback(async (payload) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.createIntent(payload);
      const data = res?.data ?? res;
      setLastPayment(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  const confirmIntent = useCallback(async (payload) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.confirmIntent(payload);
      const data = res?.data ?? res;
      setLastPayment(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  const getPaymentById = useCallback(async (payment_id) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.getPaymentById(payment_id);
      const data = res?.data ?? res;
      setLastPayment(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  const webhook = useCallback(async (payload) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.webhook(payload);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  const refundPayment = useCallback(async (payment_id, payload) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.refundPayment(payment_id, payload);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  // =====================================================
  // INVOICE
  // =====================================================
  

  const generateBilling = useCallback(async (payload) => {
    setLoadingInvoice(true);
    setError(null);
    try {
      const res = await paymentService.generateBilling(payload);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingInvoice(false);
    }
  }, []);

  // =====================================================
  // WALLET
  // =====================================================
  const getWalletBalance = useCallback(async (user_id) => {
    setLoadingWallet(true);
    setError(null);
    try {
      const res = await paymentService.getWalletBalance(user_id);
      const data = res?.data ?? res;
      setWalletBalance(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  const transferWallet = useCallback(async (user_id, payload) => {
    setLoadingWallet(true);
    setError(null);
    try {
      const res = await paymentService.transferWallet(user_id, payload);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  // =====================================================
  // SUBSCRIPTIONS
  // =====================================================
  const createSubscription = useCallback(async (payload) => {
    setLoadingSubscription(true);
    setError(null);
    try {
      const res = await paymentService.createSubscription(payload);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (id) => {
    setLoadingSubscription(true);
    setError(null);
    try {
      const res = await paymentService.cancelSubscription(id);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  const getAllSubscriptions = useCallback(async () => {
    setLoadingSubscription(true);
    setError(null);

    try {
      const res = await paymentService.getAllSubscriptions();
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  // =====================================================
  // COUPON
  // =====================================================
  const createCoupon = useCallback(async (payload) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.createCoupon(payload);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  // =====================================================
  // LEDGER
  // =====================================================
  const exportLedger = useCallback(async (params) => {
    setLoadingLedger(true);
    setError(null);
    try {
      const res = await paymentService.exportLedger(params);
      return { success: true, data: res?.data ?? res };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingLedger(false);
    }
  }, []);

  // =====================================================
  // REVENUE
  // =====================================================
  const getTodayRevenue = useCallback(async () => {
    setLoadingRevenue((s) => ({ ...s, today: true }));
    setError(null);

    try {
      const res = await paymentService.getTodayRevenue();
      const data = res?.data ?? res;
      setTodayRevenue(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      setTodayRevenue(null);
      return { success: false, error: e };
    } finally {
      setLoadingRevenue((s) => ({ ...s, today: false }));
    }
  }, []);

  const getDailyRevenue = useCallback(async () => {
    setLoadingRevenue((s) => ({ ...s, daily: true }));
    setError(null);
    try {
      const res = await paymentService.getDailyRevenue();
      const data = res?.data ?? res;
      setDailyRevenue(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      setDailyRevenue(null);
      return { success: false, error: e };
    } finally {
      setLoadingRevenue((s) => ({ ...s, daily: false }));
    }
  }, []);

  const getMonthlyRevenue = useCallback(async () => {
    setLoadingRevenue((s) => ({ ...s, monthly: true }));
    setError(null);
    try {
      const res = await paymentService.getMonthlyRevenue();
      const data = res?.data ?? res;
      setMonthlyRevenue(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      setMonthlyRevenue(null);
      return { success: false, error: e };
    } finally {
      setLoadingRevenue((s) => ({ ...s, monthly: false }));
    }
  }, []);

  const getSummaryRevenue = useCallback(async () => {
    setLoadingRevenue((s) => ({ ...s, summary: true }));
    setError(null);

    try {
      const res = await paymentService.getSummaryRevenue();
      const data = res?.data ?? res;
      setSummaryRevenue(data);
      return { success: true, data };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      setSummaryRevenue(null);
      return { success: false, error: e };
    } finally {
      setLoadingRevenue((s) => ({ ...s, summary: false }));
    }
  }, []);

  const fetchAllRevenue = useCallback(async () => {
    setLoadingRevenue({
      daily: true,
      monthly: true,
      summary: true,
      today: true,
      all: true,
    });
    setError(null);

    try {
      const [daily, monthly] = await Promise.allSettled([
        paymentService.getDailyRevenue(),
        paymentService.getMonthlyRevenue(),
      ]);

      if (daily.status === "fulfilled")
        setDailyRevenue(daily.value?.data ?? daily.value);

      if (monthly.status === "fulfilled")
        setMonthlyRevenue(monthly.value?.data ?? monthly.value);

      return { success: true };
    } catch (err) {
      const e = err?.response?.data ?? err;
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoadingRevenue({
        daily: false,
        monthly: false,
        summary: false,
        today: false,
        all: false,
      });
    }
  }, []);

  // =====================================================
  // PROVIDER VALUE
  // =====================================================
  const value = useMemo(
    () => ({
      error,
      loadingPayments,
      loadingTransactions,
      loadingInvoice,
      loadingWallet,
      loadingSubscription,
      loadingLedger,
      loadingRevenue,

      lastPayment,
      lastInvoice,
      walletBalance,
      dailyRevenue,
      monthlyRevenue,
      todayRevenue,
      summaryRevenue,
      getInvoiceById,


      // TRANSACTIONS
      createTransaction,
      confirmCashTransaction,
      getTransaction,
      pollTransactionStatus,

      // PAYMENTS
      createIntent,
      confirmIntent,
      getPaymentById,
      webhook,
      refundPayment,

      // INVOICE

      generateBilling,

      // WALLET
      getWalletBalance,
      transferWallet,

      // SUBSCRIPTIONS
      createSubscription,
      cancelSubscription,
      getAllSubscriptions,

      // COUPON
      createCoupon,

      // LEDGER
      exportLedger,

      // REVENUE
      getTodayRevenue,
      getDailyRevenue,
      getMonthlyRevenue,
      getSummaryRevenue,
      fetchAllRevenue,

      // HELPERS
      qrCodeUrl,
      setQrCodeUrl,
      transactionPolling,
    }),
    [
      error,
      loadingPayments,
      loadingTransactions,
      loadingInvoice,
      loadingWallet,
      loadingSubscription,
      loadingLedger,
      loadingRevenue,

      lastPayment,
      lastInvoice,
      walletBalance,

      dailyRevenue,
      monthlyRevenue,
      todayRevenue,
      summaryRevenue,

      qrCodeUrl,
      transactionPolling,
    ]
  );

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export default PaymentProvider;
