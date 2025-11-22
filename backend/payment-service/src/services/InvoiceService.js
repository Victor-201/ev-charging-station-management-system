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
  const doc = new PDFDocument({
    size: [300, 700], // Small receipt-style layout
    margin: 20
  });

  doc.info.Title = `Invoice #${invoice.id}`;

  // ========= HEADER =========
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('PAYMENT RECEIPT', { align: 'center' })
    .moveDown(0.5);

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Invoice ID: ${invoice.id}`)
    .text(`Transaction: ${invoice.transaction_id}`)
    .text(`User: ${invoice.user_id}`);

  doc.moveDown(0.3);

  // Divider
  doc.moveTo(20, doc.y).lineTo(280, doc.y).stroke('#000');
  doc.moveDown(0.5);

  // ========= BILL SUMMARY =========
  doc.fontSize(11).font('Helvetica-Bold').text('Payment Details');
  doc.moveDown(0.2);

  doc.font('Helvetica').fontSize(10);
  doc.text(`Amount Due: ${(+invoice.total_amount).toLocaleString()} VND`);
  doc.text(`Due Date: ${invoice.due_date?.toLocaleDateString() || 'N/A'}`);
  doc.text(`Status: ${invoice.status}`);

  doc.moveDown(0.5);
  doc.moveTo(20, doc.y).lineTo(280, doc.y).stroke();
  doc.moveDown(0.3);

  // ========= ITEMS TABLE =========
  if (invoice.items?.length > 0) {
    doc.font('Helvetica-Bold').fontSize(11).text('Items');
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(10);

    invoice.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.description}`);
      doc.text(
        `   Qty: ${item.quantity}   |   Price: ${item.unit_price.toLocaleString()}`
      );
      doc.text(
        `   Total: ${(item.quantity * item.unit_price).toLocaleString()} VND`
      );
      doc.moveDown(0.2);
    });

    doc.moveDown(0.4);
    doc.moveTo(20, doc.y).lineTo(280, doc.y).stroke();
    doc.moveDown(0.4);
  }

  // ========= TOTAL AMOUNT =========
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(
      `TOTAL: ${invoice.total_amount.toLocaleString()} VND`,
      { align: 'right' }
    )
    .moveDown(1);

  // ========= FOOTER =========
  doc
    .font('Helvetica-Oblique')
    .fontSize(10)
    .text('Thank you for your payment!', { align: 'center' });

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
