require('dotenv').config();
const app = require('./app');
const pool = require('./db');
const { connectRabbit } = require('./rabbit');
const { autoCancelLateReservations } = require('./logic/reservationLogic');
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
      console.log(`🚀 Reservation Service is running on port ${PORT}`);
    });

    // 🕒 4. Bắt đầu cron job tự động hủy đặt chỗ quá 20 phút
    cron.schedule('* * * * *', async () => {
      try {
        const result = await autoCancelLateReservations();
        if (result.cancelled > 0) {
          console.log(`🕒 Auto-cancelled ${result.cancelled} late reservations`);
        }
      } catch (err) {
        console.error('❌ Error in auto-cancel job:', err.message);
      }
    });

    console.log('✅ Auto-cancel job initialized (runs every 1 minute)');

  } catch (err) {
    console.error('❌ Failed to start Reservation Service:', err.message);
    process.exit(1);
  }
})();
