// middleware/auth.js
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { normalizeRole } from '../constants/roles.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Normalize role (convert 'driver' to 'user')
    if (decoded.role) {
      try {
        decoded.role = normalizeRole(decoded.role);
      } catch (error) {
        // If normalization fails, keep original role
      }
    }

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

    // Normalize required roles (convert 'driver' to 'user')
    const normalizedRoles = roles.map(role => {
      try {
        return normalizeRole(role);
      } catch {
        return role;
      }
    });

    if (!normalizedRoles.includes(req.user.role))
      return res.status(403).json({ message: 'Forbidden: insufficient role' });

    next();
  };
};
