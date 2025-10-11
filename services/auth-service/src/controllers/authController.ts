import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import authService from '../services/authService';

export class AuthController {
  // Register new user
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      user_id: result.user_id,
    });
  });

  // Verify OTP - Feature removed (no otp_verifications table)
  // verifyOTP endpoint has been removed

  // Login
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const deviceInfo = req.headers['user-agent'] || 'unknown';
    
    const result = await authService.login(email, password, deviceInfo);
    
    res.status(200).json(result);
  });

  // OAuth Login
  oauthLogin = asyncHandler(async (req: Request, res: Response) => {
    const { provider, provider_token } = req.body;
    const deviceInfo = req.headers['user-agent'] || 'oauth';
    
    const result = await authService.oauthLogin(provider, provider_token, deviceInfo);
    
    res.status(200).json(result);
  });

  // Refresh Token
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    const result = await authService.refreshAccessToken(refreshToken);
    
    res.status(200).json(result);
  });

  // Logout
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    await authService.logout(refreshToken);
    
    res.status(200).json({
      status: 'logged_out',
    });
  });

  // Forgot Password
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    await authService.forgotPassword(email);
    
    res.status(200).json({
      status: 'reset_token_sent',
    });
  });

  // Reset Password
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, new_password } = req.body;
    
    await authService.resetPassword(token, new_password);
    
    res.status(200).json({
      status: 'password_reset',
    });
  });

  // Link OAuth Provider
  linkProvider = asyncHandler(async (req: Request, res: Response) => {
    const { user_id, provider, provider_token } = req.body;
    
    await authService.linkProvider(user_id, provider, provider_token);
    
    res.status(200).json({
      status: 'linked',
    });
  });

  // Unlink OAuth Provider
  unlinkProvider = asyncHandler(async (req: Request, res: Response) => {
    const { user_id, provider } = req.body;
    
    await authService.unlinkProvider(user_id, provider);
    
    res.status(200).json({
      status: 'unlinked',
    });
  });

  // Admin: Get list of users
  getUserList = asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', size = '10', q, role, status } = req.query;
    
    const result = await authService.getUserList({
      page: parseInt(page as string),
      size: parseInt(size as string),
      q: q as string,
      role: role as string,
      status: status as string,
    });
    
    res.status(200).json(result);
  });

  // Admin: Deactivate user
  deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const { user_id } = req.params;
    
    await authService.deactivateUser(user_id);
    
    res.status(200).json({ status: 'deactivated' });
  });
}

export default new AuthController();
