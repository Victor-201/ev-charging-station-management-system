import PDFDocument from 'pdfkit';
import InvoiceRepository from '../repositories/InvoiceRepository.js';
import TransactionRepository from '../repositories/TransactionRepository.js';

/**
 * InvoiceService
 * Chịu trách nhiệm tạo và quản lý hóa đơn:
 * - Tạo hóa đơn từ transaction
 * - Lấy hóa đơn theo ID
 * - Xuất file PDF từ hóa đơn
 * - Liệt kê hóa đơn theo user
 * - Cập nhật trạng thái hóa đơn
 */
export default class InvoiceService {
  constructor() {
    this.invoiceRepo = new InvoiceRepository();
    this.transactionRepo = new TransactionRepository();
  }

  /**
   * Tạo hóa đơn từ transaction
   * @param {string} transaction_id
   * @returns {Promise<Invoice>}
   */
  async generateFromTransaction(transaction_id) {
    const transaction = await this.transactionRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });

    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return this.invoiceRepo.create({
      transaction_id: transaction.id,
      user_id: transaction.user_id,
      total_amount: transaction.amount,
      due_date: dueDate
    });
  }

  /**
   * Lấy hóa đơn theo ID
   * @param {string} invoice_id
   * @returns {Promise<Invoice>}
   */
  async getInvoice(invoice_id) {
    const invoice = await this.invoiceRepo.findById(invoice_id);
    if (!invoice) throw Object.assign(new Error('Invoice not found'), { status: 404 });
    return invoice;
  }

  /**
   * Xuất file PDF từ hóa đơn
   * @param {Invoice} invoice
   * @returns {PDFDocument} - Stream PDF
   */
  async generatePdfStream(invoice) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.info.Title = `Invoice #${invoice.id}`;

    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Invoice ID: ${invoice.id}`);
    doc.text(`Transaction ID: ${invoice.transaction_id}`);
    doc.text(`User ID: ${invoice.user_id}`);
    doc.text(`Amount: ${invoice.total_amount.toLocaleString()} VND`);
    doc.text(`Due Date: ${invoice.due_date?.toLocaleDateString() || 'N/A'}`);
    doc.text(`Status: ${invoice.status}`);
    doc.moveDown();
    doc.text('Thank you for your payment.', { align: 'center' });

    doc.end();
    return doc;
  }

  /** Lấy danh sách hóa đơn theo user */
  async listInvoicesByUser(user_id) {
    return this.invoiceRepo.listByUser(user_id);
  }

  /**
   * Cập nhật trạng thái hóa đơn thành "paid"
   * @param {string} invoice_id
   * @returns {Promise<Invoice>}
   */
  async markAsPaid(invoice_id) {
    const invoice = await this.invoiceRepo.updateStatus(invoice_id, 'paid');
    if (!invoice) throw Object.assign(new Error('Invoice not found'), { status: 404 });
    return invoice;
  }
}
