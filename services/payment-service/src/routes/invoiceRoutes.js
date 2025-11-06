import express from 'express';
import * as InvoiceController from '../controllers/InvoiceController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin'), InvoiceController.generateInvoice);
router.patch('/:invoice_id/pay', authorize('admin'), InvoiceController.markInvoiceAsPaid);

router.get('/overdue', authorize('admin'), InvoiceController.listOverdueInvoices);
router.get('/user/:user_id', authorize('admin', 'user'), InvoiceController.listInvoicesByUser);
router.get('/:invoice_id', authorize('admin', 'user'), InvoiceController.getInvoiceById);

export default router;
