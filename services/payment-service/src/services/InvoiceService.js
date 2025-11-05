import PDFDocument from 'pdfkit';
import InvoiceRepository from '../repositories/InvoiceRepository.js';
import TransactionRepository from '../repositories/TransactionRepository.js';

export default class InvoiceService {
  constructor() {
    this.invoiceRepo = new InvoiceRepository();
    this.transactionRepo = new TransactionRepository();
  }

  /** === Tạo hóa đơn từ transaction === */
  async generateFromTransaction(transaction_id) {
    const transaction = await this.transactionRepo.findById(transaction_id);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { status: 404 });

    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 ngày
    return this.invoiceRepo.create({
      transaction_id: transaction.id,
      user_id: transaction.user_id,
      total_amount: transaction.amount,
      due_date: dueDate
    });
  }

  /** === Lấy hóa đơn theo ID === */
  async getInvoice(invoice_id) {
    const invoice = await this.invoiceRepo.findById(invoice_id);
    if (!invoice) throw Object.assign(new Error('Invoice not found'), { status: 404 });
    return invoice;
  }

  /** === Xuất file PDF từ hóa đơn === */
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

  /** === Lấy danh sách hóa đơn của user === */
  async listInvoicesByUser(user_id) {
    return this.invoiceRepo.listByUser(user_id);
  }

  /** === Đánh dấu hóa đơn là đã thanh toán === */
  async markAsPaid(invoice_id) {
    const invoice = await this.invoiceRepo.updateStatus(invoice_id, 'paid');
    if (!invoice) throw Object.assign(new Error('Invoice not found'), { status: 404 });
    return invoice;
  }

  /** === Lấy hóa đơn quá hạn chưa thanh toán === */
  async listOverdueInvoices() {
    return this.invoiceRepo.findOverdue();
  }

  /** === Cập nhật tất cả hóa đơn quá hạn === */
  async markOverdueInvoices() {
    return this.invoiceRepo.markOverdueInvoices();
  }
}
