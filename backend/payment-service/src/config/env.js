import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'guest';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'guest';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;

export default {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME,

  CHARGING_URL: process.env.CHARGING_SERVICE_URL,
  STATION_URL: process.env.STATION_SERVICE_URL,

  RABBITMQ_USER,
  RABBITMQ_PASS,
  RABBITMQ_HOST,
  RABBITMQ_PORT,
  RABBITMQ_URL: process.env.RABBITMQ_URL || `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`,
  EXCHANGE_NAME: process.env.EXCHANGE_NAME ||'ev_charging_exchange',

  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,

  QR_ACCOUNT: process.env.QR_ACCOUNT,
  QR_BANK: process.env.QR_BANK,
};
