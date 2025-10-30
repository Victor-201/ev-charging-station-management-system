const logic = require('../logic/notificationLogic');

async function sendNotification(req, res) {
  try {
    const payload = req.body;
    if (!payload.to_user && !payload.channels) return res.status(400).json({ error: 'missing to_user or channels' });
    const r = await logic.sendNotification(payload);
    return res.json(r); // { status:'queued', id: 'N001' }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}

module.exports = { sendNotification };
