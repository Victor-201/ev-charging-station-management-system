import pool from '../config/database';
import bcrypt from 'bcryptjs';
import { User, UserListQuery } from '../types';
import logger from '../utils/logger';
import httpClient from '../utils/httpClient';

export class UserService {
  // Get user profile (from token - used by /api/v1/auth/me)
  async getUserById(userId: string): Promise<User | null> {
    try {
      // Get basic user info from user_profiles
      const result = await pool.query(
        `SELECT user_id AS id, name AS name, phone
         FROM user_profiles WHERE user_id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Return user profile data with id from user_id
      return {
        id: result.rows[0].id,
        email: '', // Email is in auth DB, not available here
        name: result.rows[0].name,
        phone: result.rows[0].phone,
        role: '', // Role is in auth DB, will be from JWT token
        status: 'active',
        created_at: new Date(),
      };
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Get user details including vehicles
  async getUserDetails(userId: string): Promise<any> {
    try {
      const userResult = await pool.query(
        `SELECT user_id AS id, name, phone, avatar_url, address, created_at, updated_at
         FROM user_profiles WHERE user_id = $1`,
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

      // Get names from user_profiles in our database
      if (userIds.length > 0) {
        const profilesResult = await pool.query(
          `SELECT user_id, name FROM user_profiles WHERE user_id = ANY($1)`,
          [userIds]
        );
        profilesResult.rows.forEach((row: any) => {
          profilesMap.set(row.user_id, row.name);
        });
      }

      // Combine data from auth service and user profiles
      const users = authServiceData.users.map((user: any) => ({
        ...user,
        name: profilesMap.get(user.user_id) || null,
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
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        setClauses.push(`name = $${paramIndex}`);
        params.push(updates.name);
        paramIndex++;
      }

      if (updates.phone !== undefined) {
        setClauses.push(`phone = $${paramIndex}`);
        params.push(updates.phone);
        paramIndex++;
      }

      if (updates.avatar_url !== undefined) {
        setClauses.push(`avatar_url = $${paramIndex}`);
        params.push(updates.avatar_url);
        paramIndex++;
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
      // Get user profile
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
        user_profile: userProfileResult.rows[0] || null,
        vehicles: vehiclesResult.rows,
        subscriptions: subscriptionsResult.rows,
        notifications: notificationsResult.rows,
        wallet_transactions: walletResult.rows,
        exported_at: new Date().toISOString(),
        data_sources: ['user_profiles', 'vehicles', 'subscriptions', 'notifications', 'wallet_transactions'],
        note: 'Authentication data (email, role, auth history) is stored separately in auth-service database'
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
}

export default new UserService();
