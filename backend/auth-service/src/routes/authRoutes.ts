import { Router } from 'express';
import authController from '../controllers/authController';
import { validate } from '../middlewares/validation';
import {
  registerSchema,
  verifyEmailSchema,
  verifyEmailTokenSchema,
  resendVerificationSchema,
  loginSchema,
  oauthLoginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  linkProviderSchema,
  unlinkProviderSchema,
} from '../middlewares/validation';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/verify', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/verify-email', validate(verifyEmailTokenSchema), authController.verifyEmailToken);
router.post('/resend-verification', validate(resendVerificationSchema), authController.resendVerificationCode);
router.post('/resend-verification-code', validate(resendVerificationSchema), authController.resendVerificationCode);
router.post('/login', validate(loginSchema), authController.login);
router.post('/login/oauth', validate(oauthLoginSchema), authController.oauthLogin);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, validate(refreshTokenSchema), authController.logout);
router.post('/link-provider', authenticate, validate(linkProviderSchema), authController.linkProvider);
router.post('/unlink-provider', authenticate, validate(unlinkProviderSchema), authController.unlinkProvider);

// Admin routes - Get user list (requires admin role)
router.get('/users', authenticate, authorize('admin'), authController.getUserList);

// Admin routes - Deactivate user (requires admin role)
router.post('/users/:user_id/deactivate', authenticate, authorize('admin'), authController.deactivateUser);

// Admin routes - Activate user (reactivate) (requires admin role)
router.post('/users/:user_id/activate', authenticate, authorize('admin'), authController.activateUser);

export default router;
