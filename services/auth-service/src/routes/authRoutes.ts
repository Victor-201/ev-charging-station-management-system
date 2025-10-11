import { Router } from 'express';
import authController from '../controllers/authController';
import { validate } from '../middlewares/validation';
import {
  registerSchema,
  loginSchema,
  oauthLoginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  linkProviderSchema,
  unlinkProviderSchema,
} from '../middlewares/validation';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
// router.post('/verify', ...) - REMOVED: OTP verification feature not available with new schema
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/login/oauth', authRateLimiter, validate(oauthLoginSchema), authController.oauthLogin);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, validate(refreshTokenSchema), authController.logout);
router.post('/link-provider', authenticate, validate(linkProviderSchema), authController.linkProvider);
router.post('/unlink-provider', authenticate, validate(unlinkProviderSchema), authController.unlinkProvider);

// Admin routes - Get user list (requires admin role)
router.get('/users', authenticate, authorize('admin'), authController.getUserList);

export default router;
