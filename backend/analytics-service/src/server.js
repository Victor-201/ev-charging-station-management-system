import dotenv from 'dotenv';
import app from './app.js';
import { getPool, reconfigurePool, getCurrentDbConfig } from './config/database.js';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDatabase = async ({ attempts = 10, delayMs = 2000 } = {}) => {
  const original = getCurrentDbConfig();
  let usedFallback = false;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await getPool().query('SELECT 1');
      if (attempt > 1 || usedFallback) {
        console.log(`Database connection established after ${attempt} attempts. Host=${getCurrentDbConfig().host} Port=${getCurrentDbConfig().port}`);
      } else {
        console.log(`Database connection established. Host=${getCurrentDbConfig().host} Port=${getCurrentDbConfig().port}`);
      }
      return;
    } catch (error) {
      console.warn(`Database not ready (attempt ${attempt}/${attempts}) host=${getCurrentDbConfig().host} port=${getCurrentDbConfig().port}: ${error.message}`);
      // Try fallback if DNS not found and not yet tried
      if (!usedFallback && /ENOTFOUND/i.test(error.message)) {
        console.warn('Applying fallback DB host 127.0.0.1:3307');
        await reconfigurePool({ host: '127.0.0.1', port: 3307 });
        usedFallback = true;
        continue; // immediate retry next loop
      }
      if (attempt === attempts) {
        console.error('Exhausted attempts. Last config:', getCurrentDbConfig());
        throw error;
      }
      await wait(delayMs);
    }
  }
  // restore original config for future operations if fallback used and original was different
  if (usedFallback && (original.host !== '127.0.0.1' || original.port !== 3307)) {
    console.log('Keeping fallback configuration active. Original:', original);
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
