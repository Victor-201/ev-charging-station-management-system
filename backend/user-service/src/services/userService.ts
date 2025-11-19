import pool from '../config/database';
import bcrypt from 'bcryptjs';
import { User, UserListQuery, SocialAccount, UpdateUserData } from '../types';
import logger from '../utils/logger';
import httpClient from '../utils/httpClient';

export class UserService {
  // Get user profile (from token - used by /api/v1/auth/me)
  async getUserById(userId: string): Promise<User | null> {
    try {
      // Get basic user info from users table
      const result = await pool.query(
        `SELECT id, email, full_name, phone, date_of_birth, role, status, email_verified, created_at
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Return user profile data
      return {
        id: result.rows[0].id,
        email: result.rows[0].email,
        full_name: result.rows[0].full_name,
        phone: result.rows[0].phone,
        date_of_birth: result.rows[0].date_of_birth,
        role: result.rows[0].role,
        status: result.rows[0].status,
        email_verified: result.rows[0].email_verified,
        created_at: result.rows[0].created_at,
      };
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Get user details including vehicles
  async getUserDetails(userId: string): Promise<any> {
    try {
      // Get user info from users table
      const userResult = await pool.query(
        `SELECT u.id, u.email, u.full_name, u.phone, u.date_of_birth, u.role, u.status,
                u.email_verified, u.created_at, u.updated_at,
                up.avatar_url, up.address
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return null;
      }

      const vehiclesResult = await pool.query(
        `SELECT id AS vehicle_id, plate_number, brand, model, battery_kwh, color, year
         FROM vehicles WHERE user_id = $1 AND status = 'ACTIVE'`,
        [userId]
      );

      return {
        ...userResult.rows[0],
        vehicles: vehiclesResult.rows,
      };
    } catch (error) {
      logger.error('Error getting user details:', error);
      throw error;
    }
  }

  // Admin: Get list of users with filtering and pagination
  async getUserList(query: UserListQuery, token?: string): Promise<{ total: number; users: User[] }> {
    try {
      const { page = 1, size = 10, q, role, status } = query;

      // Call Auth Service API to get user list
      const authServiceData = await httpClient.getUserListFromAuthService({
        page,
        size,
        q,
        role,
        status,
      }, token);

      // Get user IDs from auth service response
      const userIds = authServiceData.users.map((user: any) => user.user_id);
      let profilesMap = new Map();

      // Get full names from users table in our database
      if (userIds.length > 0) {
        const profilesResult = await pool.query(
          `SELECT id AS user_id, full_name FROM users WHERE id = ANY($1)`,
          [userIds]
        );
        profilesResult.rows.forEach((row: any) => {
          profilesMap.set(row.user_id, row.full_name);
        });
      }

      // Combine data from auth service and user profiles
      const users = authServiceData.users.map((user: any) => ({
        ...user,
        full_name: profilesMap.get(user.user_id) || null,
      }));

      return {
        total: authServiceData.total,
        users,
      };
    } catch (error) {
      logger.error('Error getting user list:', error);
      throw error;
    }
  }

  // Update user information
  async updateUser(userId: string, updates: UpdateUserData): Promise<void> {
    try {
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.full_name !== undefined) {
        setClauses.push(`full_name = $${paramIndex}`);
        params.push(updates.full_name);
        paramIndex++;
      }

      if (updates.phone !== undefined) {
        setClauses.push(`phone = $${paramIndex}`);
        params.push(updates.phone);
        paramIndex++;
      }

      if (updates.date_of_birth !== undefined) {
        setClauses.push(`date_of_birth = $${paramIndex}`);
        params.push(updates.date_of_birth);
        paramIndex++;
      }

      if (updates.address !== undefined) {
        // Update user_profiles table for address
        await pool.query(
          `INSERT INTO user_profiles (user_id, address, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (user_id)
           DO UPDATE SET address = $2, updated_at = NOW()`,
          [userId, updates.address]
        );
      }

      if (setClauses.length === 0) {
        return;
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(userId);

      await pool.query(
        `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
        params
      );
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current password hash
      const result = await client.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const passwordHash = result.rows[0].password_hash;

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, passwordHash);
      if (!isValid) {
        return false;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error changing password:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Admin: Deactivate user account
  async deactivateUser(userId: string, token?: string): Promise<void> {
    try {
      // Call Auth Service to deactivate user in auth database
      await httpClient.deactivateUserInAuthService(userId, token);

      // Optionally, mark user profile as inactive in user database
      await pool.query(
        `UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
        [userId]
      );
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  // GDPR: Export user data
  async exportUserData(userId: string): Promise<any> {
    try {
      // Get user basic info from users table
      const userResult = await pool.query(
        'SELECT id, email, full_name, phone, date_of_birth, role, status, email_verified, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );

      // Get user profile (avatar, address)
      const userProfileResult = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [userId]
      );

      // Get vehicles
      const vehiclesResult = await pool.query(
        'SELECT * FROM vehicles WHERE user_id = $1',
        [userId]
      );

      // Get subscriptions
      const subscriptionsResult = await pool.query(
        'SELECT * FROM subscriptions WHERE user_id = $1',
        [userId]
      );

      // Get notifications
      const notificationsResult = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
        [userId]
      );

      // Get wallet transactions (if wallet data stored in user-service)
      const walletResult = await pool.query(
        'SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
        [userId]
      );

      return {
        user: userResult.rows[0] || null,
        user_profile: userProfileResult.rows[0] || null,
        vehicles: vehiclesResult.rows,
        subscriptions: subscriptionsResult.rows,
        notifications: notificationsResult.rows,
        wallet_transactions: walletResult.rows,
        exported_at: new Date().toISOString(),
        data_sources: ['users', 'user_profiles', 'vehicles', 'subscriptions', 'notifications', 'wallet_transactions'],
        note: 'Authentication data (password hash, sessions, auth history) is stored separately in auth-service database'
      };
    } catch (error) {
      logger.error('Error exporting user data:', error);
      throw error;
    }
  }

  // GDPR: Erase user data (anonymize)
  async eraseUserData(userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Anonymize user profile data
      await client.query(
        `UPDATE user_profiles SET
         name = 'Deleted User',
         phone = NULL,
         avatar_url = NULL,
         address = NULL,
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
      );

      // Delete vehicles (contains personal data: plate numbers)
      await client.query('DELETE FROM vehicles WHERE user_id = $1', [userId]);

      // Cancel subscriptions (keep for accounting, but mark as cancelled)
      await client.query(
        `UPDATE subscriptions SET
         status = 'CANCELLED',
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND status != 'CANCELLED'`,
        [userId]
      );

      // Delete notifications (personal communication)
      await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

      // Anonymize wallet transactions (keep amounts for accounting)
      await client.query(
        `UPDATE wallet_transactions SET
         description = 'Transaction (user deleted)',
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
      );

      // Log erasure for audit trail
      await client.query(
        `INSERT INTO data_erasure_log (user_id, erased_at, erased_tables)
         VALUES ($1, CURRENT_TIMESTAMP, $2)`,
        [userId, ['user_profiles', 'vehicles', 'notifications']]
      );

      await client.query('COMMIT');
      logger.info(`User data erased for user: ${userId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error erasing user data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get linked social accounts for a user
  async getSocialAccounts(userId: string): Promise<SocialAccount[]> {
    try {
      const result = await pool.query(
        'SELECT id, provider, provider_user_id, username, created_at FROM user_social_accounts WHERE user_id = $1',
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting social accounts:', error);
      throw error;
    }
  }

  // Unlink a social account
  async unlinkSocialAccount(userId: string, provider: string): Promise<void> {
    try {
      await pool.query(
        'DELETE FROM user_social_accounts WHERE user_id = $1 AND provider = $2',
        [userId, provider]
      );
      logger.info(`Social account '${provider}' unlinked for user: ${userId}`);
    } catch (error) {
      logger.error('Error unlinking social account:', error);
      throw error;
    }
  }

}

export default new UserService();
