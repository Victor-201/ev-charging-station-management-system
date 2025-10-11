import { Pool } from 'pg';
import logger from '../utils/logger';

// Connection pool for Auth Database (ev_auth_db)
const authPool = new Pool({
  host: process.env.AUTH_DB_HOST || 'ev-postgres-auth',
  port: parseInt(process.env.AUTH_DB_PORT || '5432'),
  database: process.env.AUTH_DB_NAME || 'ev_auth_db',
  user: process.env.AUTH_DB_USER || 'postgres',
  password: process.env.AUTH_DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

authPool.on('connect', () => {
  logger.info('Auth Database connection established');
});

authPool.on('error', (err) => {
  logger.error('Auth Database connection error:', err);
});

export default authPool;
