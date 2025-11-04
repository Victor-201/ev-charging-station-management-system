// src/utils/logger.js
import { __DEV__ } from 'react-native';

class Logger {
  info(...args) {
    if (__DEV__) {
      console.log('[INFO]', ...args);
    }
  }

  error(...args) {
    if (__DEV__) {
      console.error('[ERROR]', ...args);
    }
  }

  warn(...args) {
    if (__DEV__) {
      console.warn('[WARN]', ...args);
    }
  }

  debug(...args) {
    if (__DEV__) {
      console.log('[DEBUG]', ...args);
    }
  }
}

export const logger = new Logger();