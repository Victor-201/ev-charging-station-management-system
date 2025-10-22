import InvoiceService from '../services/InvoiceService.js';

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await InvoiceService.getInvoice(req.params.invoice_id);
    const accept = req.headers.accept || '';
    if(accept.includes('application/pdf')){
      const stream = await InvoiceService.invoicePdfStream(invoice);
      res.setHeader('Content-Type','application/pdf');
      stream.pipe(res);
    } else {
      res.json(invoice);
    }
  } catch (err) { next(err); }
};

export const generateInvoice = async (req, res, next) => {
  try {
    const { transaction_ids } = req.body; // array
    if(!transaction_ids || !Array.isArray(transaction_ids)) throw Object.assign(new Error('transaction_ids required'), { status: 400 });

    // create invoices for each tx
    const results = [];
    for(const txId of transaction_ids){
      const inv = await InvoiceService.generateFromTransaction(txId);
      results.push(inv);
    }
    res.status(201).json(results);
  } catch (err) { next(err); }
};
