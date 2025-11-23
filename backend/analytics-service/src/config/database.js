import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;
let currentConfig;

const buildConfigFromEnv = () => ({
  host: process.env.DB_HOST || 'mysql',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'ev_analytics_db'
});

const createPool = (cfg) => mysql.createPool({
  ...cfg,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const ensurePool = () => {
  if (!pool) {
    currentConfig = buildConfigFromEnv();
    pool = createPool(currentConfig);
  }
  return pool;
};

export const getPool = () => ensurePool();

export const getCurrentDbConfig = () => ({ ...(currentConfig || buildConfigFromEnv()) });

export const reconfigurePool = async (overrideConfig = {}) => {
  const merged = { ...buildConfigFromEnv(), ...overrideConfig };
  if (pool && typeof pool.end === 'function') {
    try { await pool.end(); } catch { /* ignore */ }
  }
  currentConfig = merged;
  pool = createPool(merged);
  return pool;
};

export const query = async (sql, params = []) => {
  const [rows] = await ensurePool().execute(sql, params);
  return rows;
};
