import dotenv from 'dotenv';
import app from './app.js';
import { getPool } from './config/database.js';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDatabase = async ({ attempts = 10, delayMs = 2000 } = {}) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await getPool().query('SELECT 1');
      if (attempt > 1) {
        console.log(`Database connection established after ${attempt} attempts.`);
      }
      return;
    } catch (error) {
      console.warn(`Database not ready (attempt ${attempt}/${attempts}): ${error.message}`);
      if (attempt === attempts) {
        throw error;
      }
      await wait(delayMs);
    }
  }
};

const start = async () => {
  try {
    await waitForDatabase();
    app.listen(PORT, () => {
      console.log(`Analytics service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start service', error);
    process.exit(1);
  }
};

start();
