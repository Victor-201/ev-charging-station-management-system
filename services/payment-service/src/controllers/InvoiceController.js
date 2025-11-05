import InvoiceService from '../services/InvoiceService.js';

const invoiceService = new InvoiceService();

/** === Lấy hóa đơn theo ID (JSON / PDF) === */
export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.invoice_id);
    const accept = req.headers.accept || '';

    if (accept.includes('application/pdf')) {
      const pdfStream = await invoiceService.generatePdfStream(invoice);
      res.setHeader('Content-Type', 'application/pdf');
      pdfStream.pipe(res);
    } else {
      res.json(invoice);
    }
  } catch (err) {
    next(err);
  }
};

/** === Tạo hóa đơn từ danh sách transaction_ids === */
export const generateInvoice = async (req, res, next) => {
  try {
    const { transaction_ids } = req.body;
    if (!Array.isArray(transaction_ids))
      throw Object.assign(new Error('transaction_ids must be an array'), { status: 400 });

    const invoices = await Promise.all(
      transaction_ids.map(txId => invoiceService.generateFromTransaction(txId))
    );

    res.status(201).json(invoices);
  } catch (err) {
    next(err);
  }
};

/** === Lấy danh sách hóa đơn của user === */
export const listInvoicesByUser = async (req, res, next) => {
  try {
    const invoices = await invoiceService.listInvoicesByUser(req.params.user_id);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

/** === Đánh dấu hóa đơn là đã thanh toán === */
export const markInvoiceAsPaid = async (req, res, next) => {
  try {
    const invoice = await invoiceService.markAsPaid(req.params.invoice_id);
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

/** === Lấy danh sách hóa đơn quá hạn === */
export const listOverdueInvoices = async (req, res, next) => {
  try {
    const invoices = await invoiceService.listOverdueInvoices();
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};
