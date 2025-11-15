const dotenv = require('dotenv');
const path = require('path');

// Load .env từ folder hiện tại (reservation-service)
dotenv.config({ path: path.resolve(__dirname, '.env') });

const RABBITMQ_USER = process.env.RABBITMQ_USER || 'guest';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'guest';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;

const config = {
  PORT: process.env.PORT || 4002,
  NODE_ENV: process.env.NODE_ENV || 'development',

  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT || 3306,
  DB_NAME: process.env.DB_NAME,

  PAYMENTBASE: process.env.PAYMENT_SERVICE_URL,

  RABBITMQ_URL:
    process.env.RABBITMQ_URL ||
    `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`,

  JWT_SECRET: process.env.JWT_SECRET,
};

module.exports = config;
