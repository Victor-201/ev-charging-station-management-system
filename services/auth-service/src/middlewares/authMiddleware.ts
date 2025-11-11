import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { JWTPayload } from '../types';
import { UserRole, normalizeRole } from '../constants/roles';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JWTPayload;

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};

export const authorize = (...roles: (UserRole | string)[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    // Normalize user role (convert 'driver' to 'user')
    let userRole = req.user.role;
    try {
      userRole = normalizeRole(req.user.role);
    } catch (error) {
      // If normalization fails, use original role
    }

    // Normalize required roles
    const normalizedRoles = roles.map(role => {
      try {
        return normalizeRole(role as string);
      } catch {
        return role;
      }
    });

    if (!normalizedRoles.includes(userRole)) {
      return next(new AppError('Forbidden - Insufficient permissions', 403));
    }

    next();
  };
};
