// payment-service/middleware/auth.js
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { normalizeRole } from '../constants/roles.js';

/**
 * Middleware: Authenticate user
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Optional: Normalize role
    if (decoded.role) {
      try {
        decoded.role = normalizeRole(decoded.role);
      } catch (err) {
        console.warn('Failed to normalize role:', err.message);
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Payment Service JWT error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    } else {
      return res.status(403).json({ message: 'Authentication error' });
    }
  }
};

/**
 * Middleware: Authorize specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const normalizedRoles = roles.map(role => {
      try {
        return normalizeRole(role);
      } catch (err) {
        console.warn(`Failed to normalize role "${role}":`, err.message);
        return role;
      }
    });

    if (!normalizedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    next();
  };
};
