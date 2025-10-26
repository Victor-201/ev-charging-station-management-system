import pkg from 'pg';
import env from './env.js';

const { Pool } = pkg;

// Build connection string from env variables
const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASS}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

// Initialize pool
const pool = new Pool({ connectionString });

// Test connection
(async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database successfully.');
    client.release();
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database:', err.message);
    process.exit(1);
  }
})();

// Handle unexpected errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export default pool;
