require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');
const { connectRabbit } = require('./rabbit');
const cron = require('node-cron');

const PORT = process.env.PORT || 4002;

(async () => {
  try {
    // 🧩 1. Kiểm tra kết nối MySQL
    await pool.query('SELECT 1');
    console.log('✅ Connected to MySQL database');

    // 🧩 2. Kết nối RabbitMQ
    try {
      await connectRabbit();
      console.log('✅ Connected to RabbitMQ');
    } catch (rabbitErr) {
      console.warn('⚠️ RabbitMQ connection failed (non-fatal):', rabbitErr.message);
    }

    // 🧩 3. Bắt đầu server Express
    app.listen(PORT, () => {
      console.log(`🚀 Charging Service is running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Failed to start Charging Service:', err);
    process.exit(1);
  }
})();
