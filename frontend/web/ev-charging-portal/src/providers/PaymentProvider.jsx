// contexts/PaymentProvider.jsx
import React, { useState, useCallback, useMemo } from "react";
import { PaymentContext } from "@/context/PaymentContext";
import paymentService from "@/services/paymentService"; // hoặc "@/api/paymentService"

export const PaymentProvider = ({ children }) => {
  // generic error state
  const [error, setError] = useState(null);

  // loading flags grouped by responsibility (bạn có thể mở rộng)
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // cached data
  const [lastPayment, setLastPayment] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  // ===== PAYMENTS =====
  const createIntent = useCallback(async (payload) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.createIntent(payload);
      const data = res?.data ?? res;
      setLastPayment(data);
      setLoadingPayments(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingPayments(false);
      return { success: false, error: err };
    }
  }, []);

  const confirmIntent = useCallback(async (payload) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.confirmIntent(payload);
      const data = res?.data ?? res;
      setLastPayment(data);
      setLoadingPayments(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingPayments(false);
      return { success: false, error: err };
    }
  }, []);

  const getPaymentById = useCallback(async (payment_id) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.getPaymentById(payment_id);
      const data = res?.data ?? res;
      setLastPayment(data);
      setLoadingPayments(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingPayments(false);
      return { success: false, error: err };
    }
  }, []);

  const webhook = useCallback(async (payload) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.webhook(payload);
      const data = res?.data ?? res;
      setLoadingPayments(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingPayments(false);
      return { success: false, error: err };
    }
  }, []);

  const refundPayment = useCallback(async (payment_id, payload) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.refundPayment(payment_id, payload);
      const data = res?.data ?? res;
      setLoadingPayments(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingPayments(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== INVOICE =====
  const getInvoiceById = useCallback(async (invoice_id) => {
    setLoadingInvoice(true);
    setError(null);
    try {
      const res = await paymentService.getInvoiceById(invoice_id);
      const data = res?.data ?? res;
      setLastInvoice(data);
      setLoadingInvoice(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingInvoice(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== BILLING =====
  const generateBilling = useCallback(async (payload) => {
    setLoadingInvoice(true);
    setError(null);
    try {
      const res = await paymentService.generateBilling(payload);
      const data = res?.data ?? res;
      setLoadingInvoice(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingInvoice(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== WALLET =====
  const getWalletBalance = useCallback(async (user_id) => {
    setLoadingWallet(true);
    setError(null);
    try {
      const res = await paymentService.getWalletBalance(user_id);
      const data = res?.data ?? res;
      setWalletBalance(data);
      setLoadingWallet(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingWallet(false);
      return { success: false, error: err };
    }
  }, []);

  const transferWallet = useCallback(async (user_id, payload) => {
    setLoadingWallet(true);
    setError(null);
    try {
      const res = await paymentService.transferWallet(user_id, payload);
      const data = res?.data ?? res;
      // optionally refresh balance after transfer
      // await getWalletBalance(user_id) -- avoid circular call here; caller can call getWalletBalance
      setLoadingWallet(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingWallet(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== SUBSCRIPTION =====
  const createSubscription = useCallback(async (payload) => {
    setLoadingSubscription(true);
    setError(null);
    try {
      const res = await paymentService.createSubscription(payload);
      const data = res?.data ?? res;
      setLoadingSubscription(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSubscription(false);
      return { success: false, error: err };
    }
  }, []);

  const cancelSubscription = useCallback(async (id) => {
    setLoadingSubscription(true);
    setError(null);
    try {
      const res = await paymentService.cancelSubscription(id);
      const data = res?.data ?? res;
      setLoadingSubscription(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingSubscription(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== COUPON =====
  const createCoupon = useCallback(async (payload) => {
    setLoadingPayments(true);
    setError(null);
    try {
      const res = await paymentService.createCoupon(payload);
      const data = res?.data ?? res;
      setLoadingPayments(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingPayments(false);
      return { success: false, error: err };
    }
  }, []);

  // ===== LEDGER =====
  const exportLedger = useCallback(async (params) => {
    setLoadingLedger(true);
    setError(null);
    try {
      const res = await paymentService.exportLedger(params);
      const data = res?.data ?? res;
      setLoadingLedger(false);
      return { success: true, data };
    } catch (err) {
      setError(err);
      setLoadingLedger(false);
      return { success: false, error: err };
    }
  }, []);

  // Memoize context value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({
      // states & flags
      error,
      loadingPayments,
      loadingInvoice,
      loadingWallet,
      loadingSubscription,
      loadingLedger,

      // cached data
      lastPayment,
      lastInvoice,
      walletBalance,

      // actions
      // payments
      createIntent,
      confirmIntent,
      getPaymentById,
      webhook,
      refundPayment,

      // invoice & billing
      getInvoiceById,
      generateBilling,

      // wallet
      getWalletBalance,
      transferWallet,

      // subscription
      createSubscription,
      cancelSubscription,

      // coupon
      createCoupon,

      // ledger
      exportLedger,

      // optional setters if needed
      setLastPayment,
      setLastInvoice,
      setWalletBalance,
    }),
    [
      error,
      loadingPayments,
      loadingInvoice,
      loadingWallet,
      loadingSubscription,
      loadingLedger,
      lastPayment,
      lastInvoice,
      walletBalance,
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
    ]
  );

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};
