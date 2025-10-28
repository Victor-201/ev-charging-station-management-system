// src/hooks/usePayments.js
import { useCallback, useState } from 'react';
import * as paymentsApi from '../api/payments.api';

/**
 * usePayments
 * - createPaymentIntent, confirmPayment, getPaymentHistory, getPaymentDetail, refundPayment, getInvoice
 */

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createPaymentIntent = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.createPaymentIntent(payload);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPayment = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.confirmPayment(payload);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentHistory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.getPaymentHistory(params);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentDetail = useCallback(async (paymentId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.getPaymentById(paymentId);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refundPayment = useCallback(async (paymentId, payload = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.refundPayment(paymentId, payload);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getInvoice = useCallback(async (invoiceId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.getInvoice(invoiceId, params);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createPaymentIntent,
    confirmPayment,
    getPaymentHistory,
    getPaymentDetail,
    refundPayment,
    getInvoice,
  };
};
