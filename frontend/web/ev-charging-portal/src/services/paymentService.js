import apiClient from "@/api/apiClient";

export const paymentService = {
  getInvoices: (params) => apiClient({ method: "GET", url: "/payment-service/invoices", params }),
  getInvoiceById: (id) => apiClient({ method: "GET", url: `/payment-service/invoices/${id}` }),
  createInvoice: (payload) => apiClient({ method: "POST", url: "/payment-service/invoices", data: payload }),
  payInvoice: (id, payload) => apiClient({ method: "POST", url: `/payment-service/invoices/${id}/pay`, data: payload }),
};

export default paymentService;
