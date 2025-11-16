/**
 * Email Verification Constants
 * 
 * Centralized constants for email verification settings
 */

// Verification token expiry time (24 hours)
export const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

// Unverified user cleanup timeout
// Delete unverified users after 24 hours to match token expiry
// This gives users plenty of time to verify their email
export const UNVERIFIED_USER_CLEANUP_TIMEOUT = parseInt(
  process.env.UNVERIFIED_USER_CLEANUP_TIMEOUT || String(24 * 60 * 60 * 1000)
); // Default: 24 hours

// Cleanup job interval (how often to run the cleanup job)
// Run every hour to reduce overhead
export const CLEANUP_JOB_INTERVAL = parseInt(
  process.env.CLEANUP_JOB_INTERVAL || String(60 * 60 * 1000)
); // Default: 1 hour

// Minimum age requirement (18 years)
export const MINIMUM_AGE_YEARS = 18;

// Verification code expiry (for 6-digit codes - legacy)
export const VERIFICATION_CODE_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

