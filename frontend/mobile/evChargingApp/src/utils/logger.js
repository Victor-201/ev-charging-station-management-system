// src/utils/logger.js
import { __DEV__ } from 'react-native';

/**
 * Logger utility for environment-aware console logging
 * In production (__DEV__ === false), all logs are suppressed
 * In development (__DEV__ === true), logs are prefixed with severity level
 */
class Logger {
  constructor() {
    this.isDev = __DEV__;
  }

  info(...args) {
    if (this.isDev) {
      console.log('[INFO]', ...args);
    }
  }

  error(...args) {
    if (this.isDev) {
      console.error('[ERROR]', ...args);
    }
  }

  warn(...args) {
    if (this.isDev) {
      console.warn('[WARN]', ...args);
    }
  }

  debug(...args) {
    if (this.isDev) {
      console.log('[DEBUG]', ...args);
    }
  }

  /**
   * Log API responses (development only)
   */
  logApiResponse(endpoint, data) {
    if (this.isDev) {
      console.log(`[API] ${endpoint}:`, data);
    }
  }

  /**
   * Log API errors with context (development only)
   */
  logApiError(endpoint, error) {
    if (this.isDev) {
      console.error(`[API_ERROR] ${endpoint}:`, {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
    }
  }

  /**
   * Log Redux actions (development only)
   */
  logAction(action, payload) {
    if (this.isDev) {
      console.log(`[REDUX] ${action}:`, payload);
    }
  }
}

export const logger = new Logger();
