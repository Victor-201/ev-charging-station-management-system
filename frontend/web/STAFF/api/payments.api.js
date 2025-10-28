// src/api/payments.api.js
import client from './client';

/**
 * Payments endpoints:
 * POST /api/v1/payments/create-intent
 * POST /api/v1/payments/confirm
 * GET  /api/v1/payments/{payment_id}
 * POST /api/v1/payments/webhook    (server webhook receiver; client may not call)
 * POST /api/v1/payments/{payment_id}/refund
 *
 * Also invoice:
 * GET /api/v1/invoices/{invoice_id}
 */

export const createPaymentIntent = async (payload) => {
  const res = await client.post('/payments/create-intent', payload);
  return res.data;
};

export const confirmPayment = async (payload) => {
  const res = await client.post('/payments/confirm', payload);
  return res.data;
};

export const getPaymentById = async (paymentId) => {
  if (!paymentId) throw new Error('paymentId required');
  const res = await client.get(`/payments/${paymentId}`);
  return res.data;
};

export const refundPayment = async (paymentId, payload) => {
  if (!paymentId) throw new Error('paymentId required');
  const res = await client.post(`/payments/${paymentId}/refund`, payload);
  return res.data;
};

/* invoice helper */
export const getInvoice = async (invoiceId, params = {}) => {
  if (!invoiceId) throw new Error('invoiceId required');
  const res = await client.get(`/invoices/${invoiceId}`, { params });
  return res.data;
};
