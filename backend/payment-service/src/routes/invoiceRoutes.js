import express from 'express';
import * as InvoiceController from '../controllers/InvoiceController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize(UserRole.ADMIN), InvoiceController.generateInvoice);
router.patch('/:invoice_id/pay', authorize(UserRole.ADMIN), InvoiceController.markInvoiceAsPaid);

router.get('/overdue', authorize(UserRole.ADMIN), InvoiceController.listOverdueInvoices);
router.get('/user/:user_id', authorize(UserRole.ADMIN, UserRole.USER), InvoiceController.listInvoicesByUser);
router.get('/:invoice_id', authorize(UserRole.ADMIN, UserRole.USER), InvoiceController.getInvoiceById);

export default router;
