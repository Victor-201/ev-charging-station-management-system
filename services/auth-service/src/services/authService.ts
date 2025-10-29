import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getClient } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { JWTPayload } from '../types';
import { sendEmail } from '../utils/email';
import { outboxService } from './outboxService';
import axios from 'axios';
import { logger } from '../utils/logger';

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
    role?: string;
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
        [data.email, data.phone || null, password_hash, data.role || 'driver', 'active']
      );

      const user = userResult.rows[0];

      // Insert event vào outbox (trong cùng transaction)
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
          created_at: user.created_at
        }
      );

      await client.query('COMMIT');

      // Send welcome email (async, don't wait)
      sendEmail({
        to: data.email,
        subject: 'Welcome to EV Charging System',
        text: `Your account has been created successfully.`,
      }).catch(err => logger.error('Failed to send welcome email:', err));

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

  // Verify OTP - Removed (no otp_verifications table in new schema)
  // This feature can be re-implemented using external service or sessions table

  // Login with email and password
  async login(email: string, password: string, deviceInfo?: string) {
    const result = await query(
      `SELECT id, email, password_hash, role, status FROM users WHERE email = $1`,
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

    const { email, provider_uid, name } = providerData;

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
          [email, '', 'driver', 'active']
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

  // Forgot password - Feature removed (no password_reset_tokens table)
  // TODO: Implement password reset via email with JWT tokens or external service
  async forgotPassword(email: string) {
    const user = await query('SELECT id, email FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      // Don't reveal if email exists
      return { status: 'reset_link_sent' };
    }

    // TODO: Send password reset email with JWT token in link
    // For now, just return success
    return { status: 'reset_link_sent' };
  }

  // Reset password - Feature removed (no password_reset_tokens table)
  // TODO: Implement password reset via JWT tokens instead
  async resetPassword(token: string, newPassword: string) {
    throw new AppError('Password reset feature is currently unavailable. Please contact support.', 501);
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
