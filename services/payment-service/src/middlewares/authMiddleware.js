// middleware/auth.js
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: 'Unauthorized' });

    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: 'Forbidden: insufficient role' });

    next();
  };
};
