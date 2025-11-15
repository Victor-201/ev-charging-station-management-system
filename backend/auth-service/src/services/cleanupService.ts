import { query } from '../config/database';
import { logger } from '../utils/logger';
import { 
  UNVERIFIED_USER_CLEANUP_TIMEOUT, 
  CLEANUP_JOB_INTERVAL 
} from '../constants/verification';

export class CleanupService {
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Delete unverified users that have exceeded the timeout period
   */
  async deleteUnverifiedUsers(): Promise<void> {
    try {
      const timeoutDate = new Date(Date.now() - UNVERIFIED_USER_CLEANUP_TIMEOUT);

      // Delete unverified users created before the timeout date
      const result = await query(
        `DELETE FROM users
         WHERE email_verified = false
         AND created_at < $1
         RETURNING id, email, created_at`,
        [timeoutDate]
      );

      if (result.rows.length > 0) {
        logger.info(`Deleted ${result.rows.length} unverified users`, {
          count: result.rows.length,
          users: result.rows.map((u: any) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
          })),
        });
      } else {
        logger.debug('No unverified users to delete');
      }
    } catch (error) {
      logger.error('Failed to delete unverified users:', error);
    }
  }

  /**
   * Delete expired verification tokens
   */
  async deleteExpiredTokens(): Promise<void> {
    try {
      // Delete expired email verification tokens
      const emailTokenResult = await query(
        `DELETE FROM email_verification_tokens
         WHERE expires_at < NOW()
         AND verified_at IS NULL
         RETURNING id`,
        []
      );

      if (emailTokenResult.rows.length > 0) {
        logger.info(`Deleted ${emailTokenResult.rows.length} expired email verification tokens`);
      }

      // Delete expired password reset tokens
      const passwordTokenResult = await query(
        `DELETE FROM password_reset_tokens
         WHERE expires_at < NOW()
         AND used_at IS NULL
         RETURNING id`,
        []
      );

      if (passwordTokenResult.rows.length > 0) {
        logger.info(`Deleted ${passwordTokenResult.rows.length} expired password reset tokens`);
      }

      // Delete expired sessions
      const sessionResult = await query(
        `DELETE FROM sessions
         WHERE expires_at < NOW()
         RETURNING id`,
        []
      );

      if (sessionResult.rows.length > 0) {
        logger.info(`Deleted ${sessionResult.rows.length} expired sessions`);
      }
    } catch (error) {
      logger.error('Failed to delete expired tokens:', error);
    }
  }

  /**
   * Run all cleanup tasks
   */
  async runCleanup(): Promise<void> {
    logger.debug('Running cleanup tasks...');
    await this.deleteUnverifiedUsers();
    await this.deleteExpiredTokens();
  }

  /**
   * Start the cleanup job with specified interval
   */
  startCleanupJob(): void {
    if (this.intervalId) {
      logger.warn('Cleanup job is already running');
      return;
    }

    logger.info(`Starting cleanup job with interval: ${CLEANUP_JOB_INTERVAL}ms`, {
      unverified_user_timeout: UNVERIFIED_USER_CLEANUP_TIMEOUT,
      cleanup_interval: CLEANUP_JOB_INTERVAL,
    });

    // Run immediately on start
    this.runCleanup();

    // Then run at specified interval
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, CLEANUP_JOB_INTERVAL);
  }

  /**
   * Stop the cleanup job
   */
  stopCleanupJob(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Cleanup job stopped');
    }
  }
}

export const cleanupService = new CleanupService();

