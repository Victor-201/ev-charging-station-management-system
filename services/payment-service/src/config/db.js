import pkg from 'pg';
import env from './env.js';

const { Pool } = pkg;

// Initialize connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Verify database connection
(async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database successfully.');
    console.log(`Database URL: ${env.DATABASE_URL}`);
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
