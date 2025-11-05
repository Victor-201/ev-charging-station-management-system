import express from 'express';
import * as InvoiceController from '../controllers/InvoiceController.js';

const router = express.Router();

router.get('/overdue', InvoiceController.listOverdueInvoices);
router.get('/user/:user_id', InvoiceController.listInvoicesByUser);
router.get('/:invoice_id', InvoiceController.getInvoiceById);

router.post('/', InvoiceController.generateInvoice);
router.patch('/:invoice_id/pay', InvoiceController.markInvoiceAsPaid);

export default router;
