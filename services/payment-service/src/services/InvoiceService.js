import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import { InvoiceModel } from '../models/InvoiceModel.js';
import { TransactionModel } from '../models/TransactionModel.js';

export const InvoiceService = {
  async generateFromTransaction(transaction_id){
    const tx = await TransactionModel.findById(transaction_id);
    if(!tx) throw Object.assign(new Error('Transaction not found'), { status: 404 });

    const invoice_no = `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const invoice = await InvoiceModel.create({ invoice_no, transaction_id, amount: tx.amount, metadata: { tx } });
    return invoice;
  },

  async getInvoice(invoice_id){
    const inv = await InvoiceModel.findById(invoice_id);
    if(!inv) throw Object.assign(new Error('Invoice not found'), { status: 404 });
    return inv;
  },

  async invoicePdfStream(invoice){
    // invoice: object returned by InvoiceModel
    const doc = new PDFDocument({ size: 'A4' });
    doc.info.Title = `Invoice ${invoice.invoice_no}`;
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice No: ${invoice.invoice_no}`);
    doc.text(`Amount: ${invoice.amount}`);
    doc.text(`Issued At: ${invoice.issued_at}`);
    doc.moveDown();
    doc.text('Thank you for your business');
    doc.end();
    return doc;
  }
};

export default InvoiceService;
