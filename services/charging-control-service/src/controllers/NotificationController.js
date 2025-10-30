const NotificationService = require('../services/NotificationService');

exports.sendNotification = async (req, res) => {
  try {
    const notif = await NotificationService.sendNotification(req.body);
    res.json(notif);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
