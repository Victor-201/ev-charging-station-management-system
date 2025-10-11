// Type definitions for User Service

export interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: string;
  status: string;
  avatar_url?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Vehicle {
  id: string;
  user_id: string;
  plate_number: string;
  brand: string;
  model: string;
  battery_kwh?: number;
  color?: string;
  year?: number;
  status: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: Date;
  end_date?: Date;
  auto_renew: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  transaction_id: string;
  amount: number;
  type: string;
  status: string;
  provider?: string;
  provider_ref?: string;
  description?: string;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  data?: any;
  created_at: Date;
  read_at?: Date;
}

export interface PaginationParams {
  page: number;
  size: number;
}

export interface UserListQuery extends PaginationParams {
  q?: string;
  role?: string;
  status?: string;
}

export interface ExportDataRequest {
  user_id: string;
  format?: 'json' | 'zip';
}

export interface NotificationRequest {
  user_id: string;
  title: string;
  message: string;
  channels: string[];
  data?: any;
}
