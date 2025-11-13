import { UserRole } from '../constants/roles';

export interface User {
  id: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: UserRole | string; // Allow string for backward compatibility
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  is_verified: boolean; // Alias for email_verified
  created_at: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  date_of_birth?: Date;
}

export interface VerificationToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  verified_at?: Date;
  created_at: Date;
}

export interface OAuthProvider {
  id: string;
  user_id: string;
  provider: 'google' | 'facebook';
  provider_uid: string;
  access_token?: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  plate_number: string;
  brand: string;
  model: string;
  battery_kwh?: number;
}

export interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
}

export interface OTPRecord {
  user_id: string;
  otp: string;
  type: 'email' | 'phone';
  expires_at: Date;
}

export interface PasswordResetToken {
  user_id: string;
  token: string;
  expires_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}
