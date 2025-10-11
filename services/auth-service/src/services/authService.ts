import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { JWTPayload } from '../types';
import { sendEmail } from '../utils/email';
import { generateOTP } from '../utils/helpers';
import axios from 'axios';

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
    });
  }

  generateRefreshToken(payload: JWTPayload): string {
    const tokenPayload = {
      user_id: payload.user_id,
      email: payload.email,
      role: payload.role,
    };
    return jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret', {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  // Register new user
  async register(data: {
    email: string;
    phone?: string;
    password: string;
    name: string;
    vehicle?: {
      plate_number: string;
      brand: string;
      model: string;
      battery_kwh?: number;
    };
  }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

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

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, phone, password_hash, role, status) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, created_at`,
        [data.email, data.phone || null, password_hash, 'driver', 'active']
      );

      const user = userResult.rows[0];

      // Create user profile
      await client.query(
        'INSERT INTO user_profiles (user_id, full_name) VALUES ($1, $2)',
        [user.id, data.name]
      );

      // Create wallet for user
      await client.query(
        'INSERT INTO wallets (user_id, balance) VALUES ($1, $2)',
        [user.id, 0]
      );

      // Add vehicle if provided
      if (data.vehicle) {
        await client.query(
          `INSERT INTO vehicles (user_id, plate_number, brand, model) 
           VALUES ($1, $2, $3, $4)`,
          [user.id, data.vehicle.plate_number, data.vehicle.brand, data.vehicle.model]
        );
      }

      // Generate OTP for email verification
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN || '600') * 1000);

      await client.query(
        `INSERT INTO otp_verifications (user_id, otp, type, expires_at) 
         VALUES ($1, $2, $3, $4)`,
        [user.id, otp, 'email', expiresAt]
      );

      await client.query('COMMIT');

      // Send OTP email (async, don't wait)
      sendEmail({
        to: data.email,
        subject: 'Verify your email',
        text: `Your OTP code is: ${otp}. Valid for 10 minutes.`,
      }).catch(err => console.error('Failed to send OTP email:', err));

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

  // Verify OTP
  async verifyOTP(user_id: string, otp: string, type: 'email' | 'phone') {
    const result = await query(
      `SELECT * FROM otp_verifications 
       WHERE user_id = $1 AND otp = $2 AND type = $3 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user_id, otp, type]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Update user status to verified
    await query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['active', user_id]
    );

    // Delete used OTP
    await query(
      'DELETE FROM otp_verifications WHERE user_id = $1 AND type = $2',
      [user_id, type]
    );

    return { status: 'verified' };
  }

  // Login with email and password
  async login(email: string, password: string) {
    const result = await query(
      `SELECT u.*, up.full_name 
       FROM users u 
       LEFT JOIN user_profiles up ON u.id = up.user_id 
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = result.rows[0];

    // Check if account is active
    if (user.status !== 'active') {
      throw new AppError('Account is not active. Please verify your email.', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const payload: JWTPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store refresh token
    const refreshTokenId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at) 
       VALUES ($1, $2, $3, $4)`,
      [refreshTokenId, user.id, refreshToken, expiresAt]
    );

    return {
      accessToken,
      refreshToken,
      user_id: user.id,
      role: user.role,
    };
  }

  // OAuth login
  async oauthLogin(provider: 'google' | 'facebook', providerToken: string) {
    let providerData;

    // Verify token with provider and get user data
    if (provider === 'google') {
      providerData = await this.verifyGoogleToken(providerToken);
    } else if (provider === 'facebook') {
      providerData = await this.verifyFacebookToken(providerToken);
    } else {
      throw new AppError('Unsupported provider', 400);
    }

    const { email, provider_uid, name } = providerData;

    // Check if user exists
    let user = await query(
      'SELECT * FROM users WHERE email = $1',
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
          [email, '', 'driver', 'active']
        );

        userId = userResult.rows[0].id;

        // Create profile
        await client.query(
          'INSERT INTO user_profiles (user_id, full_name) VALUES ($1, $2)',
          [userId, name]
        );

        // Create wallet
        await client.query(
          'INSERT INTO wallets (user_id, balance) VALUES ($1, $2)',
          [userId, 0]
        );

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

    // Store refresh token
    const refreshTokenId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at) 
       VALUES ($1, $2, $3, $4)`,
      [refreshTokenId, userId, refreshToken, expiresAt]
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
      // Try to verify as ID token first (from Google Sign-In button)
      let response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
      );

      // If ID token verification fails, try as access token
      if (!response.data || !response.data.email) {
        response = await axios.get(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
        );
      }

      return {
        email: response.data.email,
        provider_uid: response.data.sub || response.data.user_id,
        name: response.data.name || response.data.email.split('@')[0],
      };
    } catch (error: any) {
      console.error('Google token verification error:', error.response?.data || error.message);
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

      // Check if refresh token exists in database
      const tokenResult = await query(
        `SELECT * FROM refresh_tokens 
         WHERE token = $1 AND user_id = $2 AND expires_at > NOW()`,
        [refreshToken, decoded.user_id]
      );

      if (tokenResult.rows.length === 0) {
        throw new AppError('Invalid or expired refresh token', 401);
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
    await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    return { status: 'logged_out' };
  }

  // Forgot password
  async forgotPassword(email: string) {
    const user = await query('SELECT id, email FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      // Don't reveal if email exists
      return { status: 'reset_token_sent' };
    }

    const userId = user.rows[0].id;

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(
      Date.now() + parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY || '3600') * 1000
    );

    // Store reset token
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [userId, resetToken, expiresAt]
    );

    // Send reset email (async)
    sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `Your password reset token is: ${resetToken}. Valid for 1 hour.`,
    }).catch(err => console.error('Failed to send reset email:', err));

    return { status: 'reset_token_sent' };
  }

  // Reset password
  async resetPassword(token: string, newPassword: string) {
    const result = await query(
      `SELECT user_id FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const userId = result.rows[0].user_id;

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 12);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [password_hash, userId]
    );

    // Delete used token
    await query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

    return { status: 'password_reset' };
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
}

export default new AuthService();
