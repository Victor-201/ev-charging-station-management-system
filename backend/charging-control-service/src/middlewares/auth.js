const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { normalizeRole } = require('../constants/roles');

/**
 * Authenticate user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (decoded.role) {
      try {
        decoded.role = normalizeRole(decoded.role);
      } catch (err) {
        console.warn('Failed to normalize role:', err.message);
      }
    }

    req.user = { ...decoded, token };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    }
    return res.status(403).json({ message: 'Authentication error' });
  }
};

/**
 * Authorize specific roles
 */
const authorize = (...roles) => {
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

module.exports = { authenticate, authorize };
