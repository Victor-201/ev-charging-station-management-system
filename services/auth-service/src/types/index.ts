export interface User {
  id: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: 'driver' | 'staff' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  date_of_birth?: Date;
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
