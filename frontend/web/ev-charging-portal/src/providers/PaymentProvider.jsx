// contexts/PaymentProvider.jsx
import React, { useState, useCallback, useMemo } from "react";
import { PaymentContext } from "@/contexts/PaymentContext";
import paymentService from "@/services/paymentService"; 

export const PaymentProvider = ({ children }) => {
  // Generic error state
  const [error, setError] = useState(null);

  // Loading flags grouped by responsibility
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false); // NEW: transactions
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState({ daily: false, monthly: false, all: false });

  // Cached data
  const [lastPayment, setLastPayment] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  // Revenue caches
  const [dailyRevenue, setDailyRevenue] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(null);
  const [todayRevenue, setTodayRevenue] = useState(null);

  // ===== TRANSACTIONS =====
  const createTransaction = useCallback(async (payload) => {
    // Separate loading flag for transactions so UI can react differently
    setLoadingTransactions(true);
    setError(null);
    try {
      const res = await paymentService.createTransaction(payload);
      const data = res?.data ?? res;
      // Optionally keep lastPayment in sync if transaction returns a payment object
      setLastPayment((prev) => data ?? prev);
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  // ===== PAYMENTS =====
  const createIntent = useCallback(async (payload) => {
    setLoadingPayments(true); setError(null);
    try {
      const res = await paymentService.createIntent(payload);
      const data = res?.data ?? res;
      setLastPayment(data);
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingPayments(false); }
  }, []);

  const confirmIntent = useCallback(async (payload) => {
    setLoadingPayments(true); setError(null);
    try {
      const res = await paymentService.confirmIntent(payload);
      const data = res?.data ?? res;
      setLastPayment(data);
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingPayments(false); }
  }, []);

  const getPaymentById = useCallback(async (payment_id) => {
    setLoadingPayments(true); setError(null);
    try {
      const res = await paymentService.getPaymentById(payment_id);
      const data = res?.data ?? res;
      setLastPayment(data);
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingPayments(false); }
  }, []);

  const webhook = useCallback(async (payload) => {
    setLoadingPayments(true); setError(null);
    try {
      const res = await paymentService.webhook(payload);
      const data = res?.data ?? res;
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingPayments(false); }
  }, []);

  const refundPayment = useCallback(async (payment_id, payload) => {
    setLoadingPayments(true); setError(null);
    try {
      const res = await paymentService.refundPayment(payment_id, payload);
      const data = res?.data ?? res;
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingPayments(false); }
  }, []);

  // ===== INVOICE =====
  const getInvoiceById = useCallback(async (invoice_id) => {
    setLoadingInvoice(true); setError(null);
    try {
      const res = await paymentService.getInvoiceById(invoice_id);
      const data = res?.data ?? res;
      setLastInvoice(data);
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingInvoice(false); }
  }, []);

  const generateBilling = useCallback(async (payload) => {
    setLoadingInvoice(true); setError(null);
    try {
      const res = await paymentService.generateBilling(payload);
      const data = res?.data ?? res;
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingInvoice(false); }
  }, []);

  // ===== WALLET =====
  const getWalletBalance = useCallback(async (user_id) => {
    setLoadingWallet(true); setError(null);
    try {
      const res = await paymentService.getWalletBalance(user_id);
      const data = res?.data ?? res;
      setWalletBalance(data);
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingWallet(false); }
  }, []);

  const transferWallet = useCallback(async (user_id, payload) => {
    setLoadingWallet(true); setError(null);
    try {
      const res = await paymentService.transferWallet(user_id, payload);
      const data = res?.data ?? res;
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingWallet(false); }
  }, []);

  // ===== SUBSCRIPTION =====
  const createSubscription = useCallback(async (payload) => {
    setLoadingSubscription(true); setError(null);
    try {
      const res = await paymentService.createSubscription(payload);
      const data = res?.data ?? res;
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingSubscription(false); }
  }, []);

  const cancelSubscription = useCallback(async (id) => {
    setLoadingSubscription(true); setError(null);
    try {
      const res = await paymentService.cancelSubscription(id);
      const data = res?.data ?? res;
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingSubscription(false); }
  }, []);

  // ===== COUPON =====
  const createCoupon = useCallback(async (payload) => {
    setLoadingPayments(true); setError(null);
    try {
      const res = await paymentService.createCoupon(payload);
      const data = res?.data ?? res;
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingPayments(false); }
  }, []);

  // ===== LEDGER =====
  const exportLedger = useCallback(async (params) => {
    setLoadingLedger(true); setError(null);
    try {
      const res = await paymentService.exportLedger(params);
      const data = res?.data ?? res;
      return { success: true, data };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally { setLoadingLedger(false); }
  }, []);

  // ===== REVENUE =====

  const getTodayRevenue = useCallback(async () => {
    setLoadingRevenue((s) => ({ ...s, today: true }));
    setError(null);
    try {
      const res = await paymentService.getTodayRevenue();
      const data = res?.data ?? res;
      setTodayRevenue(data);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setTodayRevenue(null);
      return { success: false, error: err };
    } finally {
      setLoadingRevenue((s) => ({ ...s, today: false }));
    }
  }, []);
  const getDailyRevenue = useCallback(async () => {
    setLoadingRevenue((s) => ({ ...s, daily: true })); setError(null);
    try {
      const res = await paymentService.getDailyRevenue();
      const data = res?.data ?? res;
      setDailyRevenue(data);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setDailyRevenue(null);
      return { success: false, error: err };
    } finally {
      setLoadingRevenue((s) => ({ ...s, daily: false }));
    }
  }, []);

  const getMonthlyRevenue = useCallback(async () => {
    setLoadingRevenue((s) => ({ ...s, monthly: true })); setError(null);
    try {
      const res = await paymentService.getMonthlyRevenue();
      const data = res?.data ?? res;
      setMonthlyRevenue(data);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setMonthlyRevenue(null);
      return { success: false, error: err };
    } finally {
      setLoadingRevenue((s) => ({ ...s, monthly: false }));
    }
  }, []);

  const fetchAllRevenue = useCallback(async () => {
    setLoadingRevenue({ daily: true, monthly: true, all: true }); setError(null);
    try {
      const [dailyRes, monthlyRes] = await Promise.allSettled([
        paymentService.getDailyRevenue(),
        paymentService.getMonthlyRevenue(),
      ]);

      let dailyResult = null;
      let monthlyResult = null;

      if (dailyRes.status === "fulfilled") {
        dailyResult = dailyRes.value?.data ?? dailyRes.value;
        setDailyRevenue(dailyResult);
      } else setError((e) => e ?? { daily: dailyRes.reason });

      if (monthlyRes.status === "fulfilled") {
        monthlyResult = monthlyRes.value?.data ?? monthlyRes.value;
        setMonthlyRevenue(monthlyResult);
      } else setError((e) => ({ ...(e || {}), monthly: monthlyRes.reason }));

      return { success: true, daily: dailyResult, monthly: monthlyResult };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoadingRevenue({ daily: false, monthly: false, all: false });
    }
  }, []);
  

  // Memoize context value
  const value = useMemo(() => ({
    error,
    loadingPayments,
    loadingTransactions, // exposed
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

    // TRANSACTIONS
    createTransaction,

    // PAYMENTS
    createIntent,
    confirmIntent,
    getPaymentById,
    webhook,
    refundPayment,

    // INVOICE
    getInvoiceById,
    generateBilling,

    // WALLET
    getWalletBalance,
    transferWallet,

    // SUBSCRIPTION
    createSubscription,
    cancelSubscription,

    // COUPON
    createCoupon,

    // LEDGER
    exportLedger,

    // REVENUE
    getTodayRevenue,
    getDailyRevenue,
    getMonthlyRevenue,
    fetchAllRevenue,

    // setters (optional)
    setLastPayment,
    setLastInvoice,
    setWalletBalance,
    setDailyRevenue,
    setMonthlyRevenue,
  }), [
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
    createTransaction,
    createIntent,
    confirmIntent,
    getPaymentById,
    webhook,
    refundPayment,
    getInvoiceById,
    generateBilling,
    getWalletBalance,
    transferWallet,
    createSubscription,
    cancelSubscription,
    createCoupon,
    exportLedger,
    getTodayRevenue,
    getDailyRevenue,
    getMonthlyRevenue,
    fetchAllRevenue,
  ]);

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};

export default PaymentProvider;
