/**
 * Email Verification Constants
 * 
 * Centralized constants for email verification settings
 */

// Verification token expiry time (24 hours)
export const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

// Unverified user cleanup timeout
// For testing: 1 minute (60 * 1000)
// For production: consider longer period like 24 hours
export const UNVERIFIED_USER_CLEANUP_TIMEOUT = parseInt(
  process.env.UNVERIFIED_USER_CLEANUP_TIMEOUT || '60000'
); // Default: 1 minute

// Cleanup job interval (how often to run the cleanup job)
export const CLEANUP_JOB_INTERVAL = parseInt(
  process.env.CLEANUP_JOB_INTERVAL || '30000'
); // Default: 30 seconds

// Minimum age requirement (18 years)
export const MINIMUM_AGE_YEARS = 18;

// Verification code expiry (for 6-digit codes - legacy)
export const VERIFICATION_CODE_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

