const logic = require('../logic/qrLogic');

async function generateQr(req, res) {
  try {
    const { reservation_id, expires_in } = req.body;
    if (!reservation_id) return res.status(400).json({ error: 'missing reservation_id' });
    const r = await logic.generateQr({ reservation_id, expires_in });
    return res.json({ qr_code: r.qr_code, url: r.url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

async function validateQr(req, res) {
  try {
    const qr_id = req.params.qr_id;
    const r = await logic.validateQr(qr_id);
    return res.json(r); // { valid: true, reservation_id: 'R123' }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

module.exports = { generateQr, validateQr };
