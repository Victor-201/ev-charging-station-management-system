import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME,

  RABBITMQ_USER: process.env.RABBITMQ_USER,
  RABBITMQ_PASS: process.env.RABBITMQ_PASS,
  RABBITMQ_HOST: process.env.RABBITMQ_HOST,
  RABBITMQ_PORT: process.env.RABBITMQ_PORT || 5672,

  PAYMENT_GATEWAY_API_KEY: process.env.PAYMENT_GATEWAY_API_KEY,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET
};
