import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use skip function to avoid trust proxy warning in development
  skip: (req) => process.env.NODE_ENV === 'development' && !req.ip,
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use skip function to avoid trust proxy warning in development
  skip: (req) => process.env.NODE_ENV === 'development' && !req.ip,
});
