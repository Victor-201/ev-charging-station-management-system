import InvoiceService from '../services/InvoiceService.js';

const invoiceService = new InvoiceService();

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

export const listInvoicesByUser = async (req, res, next) => {
  try {
    const invoices = await invoiceService.listInvoicesByUser(req.params.user_id);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};
