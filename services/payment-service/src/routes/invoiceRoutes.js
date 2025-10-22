import express from 'express';
import * as InvoiceController from '../controllers/InvoiceController.js';
const router = express.Router();

router.get('/:invoice_id', InvoiceController.getInvoiceById);

export default router;
