import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PAYMENT_GATEWAY_API_KEY: process.env.PAYMENT_GATEWAY_API_KEY,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET
};
