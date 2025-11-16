import apiClient from "@/api/apiClient";

export const paymentService = {
  // ===== PAYMENTS =====
  createIntent: (payload) =>
    apiClient({ method: "POST", url: "api/v1/payments/create-intent", data: payload }),

  confirmIntent: (payload) =>
    apiClient({ method: "POST", url: "api/v1/payments/confirm", data: payload }),

  getPaymentById: (payment_id) =>
    apiClient({ method: "GET", url: `api/v1/payments/${payment_id}` }),

  webhook: (payload) =>
    apiClient({ method: "POST", url: "api/v1/payments/webhook", data: payload }),

  refundPayment: (payment_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/payments/${payment_id}/refund`, data: payload }),

  // ===== INVOICE =====
  getInvoiceById: (invoice_id) =>
    apiClient({ method: "GET", url: `api/v1/invoices/${invoice_id}` }),

  // ===== BILLING =====
  generateBilling: (payload) =>
    apiClient({ method: "POST", url: "api/v1/billing/generate", data: payload }),

  // ===== WALLET =====
  getWalletBalance: (user_id) =>
    apiClient({ method: "GET", url: `api/v1/wallets/${user_id}/balance` }),

  transferWallet: (user_id, payload) =>
    apiClient({ method: "POST", url: `api/v1/wallets/${user_id}/transfer`, data: payload }),

  // ===== SUBSCRIPTION =====
  createSubscription: (payload) =>
    apiClient({ method: "POST", url: "api/v1/subscriptions", data: payload }),

  cancelSubscription: (id) =>
    apiClient({ method: "POST", url: `api/v1/subscriptions/${id}/cancel` }),

  // ===== COUPON =====
  createCoupon: (payload) =>
    apiClient({ method: "POST", url: "api/v1/coupons", data: payload }),

  // ===== LEDGER =====
  exportLedger: (params) =>
    apiClient({ method: "GET", url: "api/v1/ledger/export", params }),

  // ===== REVENUE =====
  getDailyRevenue: () =>
    apiClient({
      method: "GET",
      url: "api/v1/payments/revenue/daily",

    }),

  getMonthlyRevenue: () =>
    apiClient({
      method: "GET",
      url: "api/v1/payments/revenue/monthly",
    }),
};

export default paymentService;
