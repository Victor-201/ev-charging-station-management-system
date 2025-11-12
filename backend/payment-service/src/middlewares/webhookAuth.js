import config from '../config/env.js';

export const verifyWebhook = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Apikey ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing API Key' });
  }

  const apiKey = authHeader.split(' ')[1];

  if (apiKey !== config.WEBHOOK_SECRET) {
    return res.status(401).json({ message: 'Unauthorized: Invalid API Key' });
  }

  next();
};
