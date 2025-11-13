import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { query, getClient } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { JWTPayload } from '../types';
import { sendEmail } from '../utils/email';
import { outboxService } from './outboxService';
import { logger } from '../utils/logger';
import {
  VERIFICATION_TOKEN_EXPIRY,
  VERIFICATION_TOKEN_EXPIRY_HOURS,
  MINIMUM_AGE_YEARS
} from '../constants/verification';

export class AuthService {
  // Generate JWT tokens
  generateAccessToken(payload: JWTPayload): string {
    const tokenPayload = {
      user_id: payload.user_id,
      email: payload.email,
      role: payload.role,
    };
    return jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default-secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    } as jwt.SignOptions);
  }

  generateRefreshToken(payload: JWTPayload): string {
    const tokenPayload = {
      user_id: payload.user_id,
      email: payload.email,
      role: payload.role,
    };
    return jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret', {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    } as jwt.SignOptions);
  }

  // Register new user
  async register(data: {
    email: string;
    phone?: string;
    password: string;
    password_confirmation?: string;
    role?: string;
    full_name: string;
    date_of_birth: Date | string;
  }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Validate password confirmation
      if (data.password_confirmation && data.password !== data.password_confirmation) {
        throw new AppError('Password confirmation does not match password', 400);
      }

      // Validate age requirement (18+ years old)
      const dateOfBirth = new Date(data.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
      }

      if (age < MINIMUM_AGE_YEARS) {
        throw new AppError(`You must be at least ${MINIMUM_AGE_YEARS} years old to register`, 400);
      }

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [data.email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('Email already registered', 409);
      }

      // Hash password
      const password_hash = await bcrypt.hash(data.password, 12);

      // Create user (email_verified = false for new registrations)
      const userResult = await client.query(
        `INSERT INTO users (email, phone, password_hash, role, status, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, created_at`,
        [data.email, data.phone || null, password_hash, data.role || 'user', 'active', false]
      );

      const user = userResult.rows[0];

      // Generate verification token (JWT-based)
      const verificationToken = jwt.sign(
        { user_id: user.id, email: user.email, type: 'email_verification' },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: `${VERIFICATION_TOKEN_EXPIRY_HOURS}h` }
      );

      // Hash the token for storage
      const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
      const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

      // Store verification token in database
      await client.query(
        `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt]
      );

      // Also generate 6-digit verification code for backward compatibility
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

      // Update user with verification code
      await client.query(
        'UPDATE users SET verification_code = $1, verification_code_expires_at = $2 WHERE id = $3',
        [verificationCode, verificationCodeExpiresAt, user.id]
      );

      // Insert event into outbox (in the same transaction)
      await outboxService.insertEvent(
        client,
        'User',
        user.id,
        'user.created',
        {
          user_id: user.id,
          email: user.email,
          role: user.role,
          phone: data.phone,
          full_name: data.full_name,
          date_of_birth: data.date_of_birth,
          created_at: user.created_at,
        }
      );

      await client.query('COMMIT');

      // Create verification URL
      const verificationUrl = `${process.env.FRONTEND_URL || 'https://example.com'}/verify-email?token=${verificationToken}`;

      // Send verification email (async, don't wait)
      sendEmail({
        to: data.email,
        subject: 'Verify your email - EV Charging System',
        html: `
          <h2>Welcome to EV Charging System!</h2>
          <p>Hello ${data.full_name},</p>
          <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in ${VERIFICATION_TOKEN_EXPIRY_HOURS} hours.</p>
          <p>Alternatively, you can use this 6-digit verification code: <b>${verificationCode}</b> (expires in 15 minutes)</p>
          <p>If you did not create an account, please ignore this email.</p>
        `,
      }).catch(err => logger.error('Failed to send verification email:', err));

      return {
        user_id: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Verify email with 6-digit code
  async verifyEmail(email: string, verificationCode: string) {
    // Find user with matching email and verification code
    const result = await query(
      `SELECT id, email, verification_code, verification_code_expires_at
       FROM users
       WHERE email = $1 AND verification_code = $2`,
      [email, verificationCode]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid verification code', 400);
    }

    const user = result.rows[0];

    // Check if code has expired
    if (new Date() > new Date(user.verification_code_expires_at)) {
      throw new AppError('Verification code has expired', 400);
    }

    // Update user: mark as verified and clear verification code
    await query(
      `UPDATE users
       SET email_verified = true,
           verification_code = NULL,
           verification_code_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );

    return {
      user_id: user.id,
      email: user.email,
    };
  }

  // Verify email with token (new method)
  async verifyEmailToken(token: string) {
    try {
      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret'
      ) as any;

      if (decoded.type !== 'email_verification') {
        throw new AppError('Invalid verification token', 400);
      }

      // Hash the token to find it in database
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find the verification token
      const tokenResult = await query(
        `SELECT id, user_id, expires_at, verified_at
         FROM email_verification_tokens
         WHERE token_hash = $1`,
        [tokenHash]
      );

      if (tokenResult.rows.length === 0) {
        throw new AppError('Invalid verification token', 400);
      }

      const verificationRecord = tokenResult.rows[0];

      // Check if token has already been used
      if (verificationRecord.verified_at) {
        throw new AppError('Verification token has already been used', 400);
      }

      // Check if token has expired
      if (new Date() > new Date(verificationRecord.expires_at)) {
        throw new AppError('Verification token has expired', 400);
      }

      // Update user: mark as verified
      await query(
        `UPDATE users
         SET email_verified = true,
             verification_code = NULL,
             verification_code_expires_at = NULL
         WHERE id = $1`,
        [verificationRecord.user_id]
      );

      // Mark token as used
      await query(
        `UPDATE email_verification_tokens
         SET verified_at = NOW()
         WHERE id = $1`,
        [verificationRecord.id]
      );

      // Get user info
      const userResult = await query(
        'SELECT id, email FROM users WHERE id = $1',
        [verificationRecord.user_id]
      );

      return {
        user_id: userResult.rows[0].id,
        email: userResult.rows[0].email,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid verification token', 400);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Verification token has expired', 400);
      }
      throw error;
    }
  }

  // Resend verification code
  async resendVerificationCode(email: string) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'SELECT id, email, email_verified FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        // Don't reveal if email exists, just return a success-like message
        return { message: 'If your email is registered, a new verification link has been sent.' };
      }

      const user = userResult.rows[0];

      if (user.email_verified) {
        throw new AppError('Email is already verified', 400);
      }

      // Invalidate old verification tokens
      await client.query(
        `UPDATE email_verification_tokens
         SET verified_at = NOW()
         WHERE user_id = $1 AND verified_at IS NULL`,
        [user.id]
      );

      // Generate new verification token
      const verificationToken = jwt.sign(
        { user_id: user.id, email: user.email, type: 'email_verification' },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: `${VERIFICATION_TOKEN_EXPIRY_HOURS}h` }
      );

      // Hash the token for storage
      const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
      const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

      // Store new verification token
      await client.query(
        `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt]
      );

      // Generate a new 6-digit verification code and expiry
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Update user with the new code
      await client.query(
        'UPDATE users SET verification_code = $1, verification_code_expires_at = $2 WHERE id = $3',
        [verificationCode, verificationCodeExpiresAt, user.id]
      );

      await client.query('COMMIT');

      // Create verification URL
      const verificationUrl = `${process.env.FRONTEND_URL || 'https://example.com'}/verify-email?token=${verificationToken}`;

      // Send the new verification email
      sendEmail({
        to: user.email,
        subject: 'Your New Verification Link - EV Charging System',
        html: `
          <h2>Email Verification</h2>
          <p>You requested a new verification link. Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in ${VERIFICATION_TOKEN_EXPIRY_HOURS} hours.</p>
          <p>Alternatively, you can use this 6-digit verification code: <b>${verificationCode}</b> (expires in 15 minutes)</p>
        `,
      }).catch(err => logger.error('Failed to resend verification email:', err));

      return { message: 'A new verification link has been sent to your email.' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }


  // Verify OTP - Removed (no otp_verifications table in new schema)
  // This feature can be re-implemented using external service or sessions table

  // Login with email and password
  async login(email: string, password: string, deviceInfo?: string) {
    const result = await query(
      `SELECT id, email, password_hash, role, status, email_verified FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];

    // Check if account is active
    if (user.status !== 'active') {
      throw new AppError('Account is not active', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if email is verified
    if (!user.email_verified) {
      throw new AppError('Please verify your email address before logging in. Check your email for the verification link.', 403);
    }

    // Generate tokens
    const payload: JWTPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store session with hashed refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO sessions (user_id, refresh_token_hash, device_info, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, refreshTokenHash, deviceInfo || 'unknown', expiresAt]
    );

    return {
      accessToken,
      refreshToken,
      user_id: user.id,
      role: user.role,
    };
  }

  // OAuth login
  async oauthLogin(provider: 'google' | 'facebook', providerToken: string, deviceInfo?: string) {
    let providerData;

    // Verify token with provider and get user data
    if (provider === 'google') {
      providerData = await this.verifyGoogleToken(providerToken);
    } else if (provider === 'facebook') {
      providerData = await this.verifyFacebookToken(providerToken);
    } else {
      throw new AppError('Unsupported provider', 400);
    }

    const { email, provider_uid } = providerData;

    // Check if user exists
    let user = await query(
      'SELECT id, email, role, status FROM users WHERE email = $1',
      [email]
    );

    let isNewUser = false;
    let userId: string;

    if (user.rows.length === 0) {
      // Create new user
      isNewUser = true;
      const client = await getClient();

      try {
        await client.query('BEGIN');

        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, role, status)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [email, '', 'user', 'active']
        );

        userId = userResult.rows[0].id;

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      userId = user.rows[0].id;
    }

    // Link OAuth provider
    await query(
      `INSERT INTO user_auth_providers (user_id, provider, provider_uid, access_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, provider) DO UPDATE SET
       provider_uid = $3, access_token = $4`,
      [userId, provider, provider_uid, providerToken]
    );

    // Generate tokens
    const userInfo = await query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );

    const payload: JWTPayload = {
      user_id: userInfo.rows[0].id,
      email: userInfo.rows[0].email,
      role: userInfo.rows[0].role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store session with hashed refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO sessions (user_id, refresh_token_hash, device_info, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, refreshTokenHash, deviceInfo || 'oauth', expiresAt]
    );

    return {
      accessToken,
      refreshToken,
      user_id: userId,
      is_new_user: isNewUser,
    };
  }

    // Verify Google token
  private async verifyGoogleToken(token: string) {
    try {
      logger.info('🔍 Verifying Google token...');

      // Try to verify as ID token first (from Google Sign-In button)
      let response;
      let userData = null;

      try {
        logger.info('📋 Trying ID token verification...');
        response = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
        );

        if (response.data && response.data.email) {
          logger.info('✅ ID token verification successful');
          userData = {
            email: response.data.email,
            provider_uid: response.data.sub,
            name: response.data.name || response.data.email.split('@')[0],
          };
        }
      } catch (idTokenError) {
        logger.info('⚠️ ID token verification failed, trying access token...');

        // If ID token verification fails, try as access token
        try {
          response = await axios.get(
            `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
          );

          if (response.data && response.data.email) {
            logger.info('✅ Access token verification successful');
            userData = {
              email: response.data.email,
              provider_uid: response.data.sub || response.data.user_id,
              name: response.data.name || response.data.email.split('@')[0],
            };
          }
        } catch (accessTokenError) {
          logger.info('⚠️ Access token verification failed, trying user info API...');

          // Last resort: use the token to get user info
          try {
            response = await axios.get(
              `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`
            );

            if (response.data && response.data.email) {
              logger.info('✅ User info API verification successful');
              userData = {
                email: response.data.email,
                provider_uid: response.data.id,
                name: response.data.name || response.data.email.split('@')[0],
              };
            }
          } catch (userInfoError) {
            logger.error('❌ All Google token verification methods failed');
            throw userInfoError;
          }
        }
      }

      if (!userData || !userData.email) {
        throw new Error('Unable to get user data from Google token');
      }

      logger.info('✅ Google token verified successfully:', {
        email: userData.email,
        provider_uid: userData.provider_uid
      });

      return userData;
    } catch (error: any) {
      logger.error('Google token verification error:', {
        error: error.response?.data || error.message
      });
      throw new AppError('Invalid Google token', 401);
    }
  }

  // Verify Facebook token
  private async verifyFacebookToken(token: string) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,email,name&access_token=${token}`
      );

      return {
        email: response.data.email,
        provider_uid: response.data.id,
        name: response.data.name || response.data.email.split('@')[0],
      };
    } catch (error) {
      throw new AppError('Invalid Facebook token', 401);
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'default-refresh-secret'
      ) as JWTPayload;

      // Check if session exists with matching hashed refresh token
      const sessionResult = await query(
        `SELECT id, user_id, refresh_token_hash FROM sessions
         WHERE user_id = $1 AND expires_at > NOW()`,
        [decoded.user_id]
      );

      if (sessionResult.rows.length === 0) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Verify refresh token hash against stored sessions
      let validSession = null;
      for (const session of sessionResult.rows) {
        const isValid = await bcrypt.compare(refreshToken, session.refresh_token_hash);
        if (isValid) {
          validSession = session;
          break;
        }
      }

      if (!validSession) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new access token
      const payload: JWTPayload = {
        user_id: decoded.user_id,
        email: decoded.email,
        role: decoded.role,
      };

      const accessToken = this.generateAccessToken(payload);

      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  // Logout
  async logout(refreshToken: string) {
    try {
      // Verify refresh token to get user_id
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'default-refresh-secret'
      ) as JWTPayload;

      // Delete sessions matching this refresh token
      const sessionResult = await query(
        `SELECT id, refresh_token_hash FROM sessions WHERE user_id = $1`,
        [decoded.user_id]
      );

      for (const session of sessionResult.rows) {
        const isValid = await bcrypt.compare(refreshToken, session.refresh_token_hash);
        if (isValid) {
          await query('DELETE FROM sessions WHERE id = $1', [session.id]);
          break;
        }
      }

      return { status: 'logged_out' };
    } catch (error) {
      // Even if token is invalid, return success
      return { status: 'logged_out' };
    }
  }

  async forgotPassword(email: string) {
    const userResult = await query('SELECT id, email FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      // To prevent email enumeration attacks, we don't reveal if the user was found.
      // We'll send a success-like response in either case.
      logger.warn(`Password reset attempt for non-existent email: ${email}`);
      return { message: 'If your email is registered, you will receive a password reset link.' };
    }

    const user = userResult.rows[0];

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token expiry (e.g., 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store the hashed token and expiry in the database
    await query(
      'UPDATE users SET password_reset_token = $1, password_reset_token_expires_at = $2 WHERE id = $3',
      [hashedToken, expiresAt, user.id]
    );

    // Create the reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send the email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - EV Charging System',
        html: `You requested a password reset. Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>. This link will expire in 1 hour.`,
      });
    } catch (error) {
      logger.error(`Failed to send password reset email to ${user.email}`, error);
      // Even if email fails, we don't want to inform the user to prevent attacks.
    }

    // For development/testing, we return the token. In production, this should be removed.
    return {
      message: 'If your email is registered, you will receive a password reset link.',
      development_only_reset_token: resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Hash the token to find it in the database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the user with the matching, non-expired token
    const userResult = await query(
      `SELECT id FROM users
       WHERE password_reset_token = $1 AND password_reset_token_expires_at > NOW()`,
      [hashedToken]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    const user = userResult.rows[0];

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update the user's password and clear the reset token fields
    await query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_token_expires_at = NULL
       WHERE id = $2`,
      [newPasswordHash, user.id]
    );

    return { message: 'Password has been reset successfully.' };
  }

  // Link OAuth provider to existing account
  async linkProvider(user_id: string, provider: string, provider_token: string) {
    let providerData;

    if (provider === 'google') {
      providerData = await this.verifyGoogleToken(provider_token);
    } else if (provider === 'facebook') {
      providerData = await this.verifyFacebookToken(provider_token);
    } else {
      throw new AppError('Unsupported provider', 400);
    }

    // Check if provider is already linked to another account
    const existing = await query(
      'SELECT user_id FROM user_auth_providers WHERE provider = $1 AND provider_uid = $2',
      [provider, providerData.provider_uid]
    );

    if (existing.rows.length > 0 && existing.rows[0].user_id !== user_id) {
      throw new AppError('This provider account is already linked to another user', 409);
    }

    // Link provider
    await query(
      `INSERT INTO user_auth_providers (user_id, provider, provider_uid, access_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, provider) DO UPDATE SET
       provider_uid = $3, access_token = $4`,
      [user_id, provider, providerData.provider_uid, provider_token]
    );

    return { status: 'linked' };
  }

  // Unlink OAuth provider
  async unlinkProvider(user_id: string, provider: string) {
    // Check if user has a password set
    const user = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user_id]
    );

    if (!user.rows[0].password_hash || user.rows[0].password_hash === '') {
      // Check if user has other providers
      const providers = await query(
        'SELECT COUNT(*) as count FROM user_auth_providers WHERE user_id = $1',
        [user_id]
      );

      if (parseInt(providers.rows[0].count) <= 1) {
        throw new AppError('Cannot unlink last authentication method. Please set a password first.', 400);
      }
    }

    const result = await query(
      'DELETE FROM user_auth_providers WHERE user_id = $1 AND provider = $2',
      [user_id, provider]
    );

    if (result.rowCount === 0) {
      throw new AppError('Provider not linked to this account', 404);
    }

    return { status: 'unlinked' };
  }

  // Admin: Get list of users with filtering and pagination
  async getUserList(params: {
    page?: number;
    size?: number;
    q?: string;
    role?: string;
    status?: string;
  }): Promise<{ total: number; users: any[] }> {
    try {
      const { page = 1, size = 10, q, role, status } = params;
      const offset = (page - 1) * size;

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (q) {
        whereConditions.push(`(email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
        queryParams.push(`%${q}%`);
        paramIndex++;
      }

      if (role) {
        whereConditions.push(`role = $${paramIndex}`);
        queryParams.push(role);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].count);

      // Get paginated users
      const usersResult = await query(
        `SELECT id AS user_id, email, phone, role, status, created_at
         FROM users ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, size, offset]
      );

      return {
        total,
        users: usersResult.rows,
      };
    } catch (error) {
      throw new AppError('Failed to get user list', 500);
    }
  }

  // Admin: Deactivate user
  async deactivateUser(userId: string): Promise<void> {
    try {
      const result = await query(
        `UPDATE users
         SET status = 'inactive'
         WHERE id = $1`,
        [userId]
      );

      if (result.rowCount === 0) {
        throw new AppError('User not found', 404);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to deactivate user', 500);
    }
  }
}

export default new AuthService();
