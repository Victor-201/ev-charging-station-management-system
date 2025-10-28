import express from 'express';
import * as InvoiceController from '../controllers/InvoiceController.js';

const router = express.Router();

router.get('/:invoice_id', InvoiceController.getInvoiceById);
router.post('/', InvoiceController.generateInvoice);
router.get('/user/:user_id', InvoiceController.listInvoicesByUser);

export default router;
