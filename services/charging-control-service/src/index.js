require('dotenv').config();
const app = require('./app');
const { connectRabbit } = require('./rabbit');
const pool = require('./db');

const PORT = process.env.PORT || 4002;

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to MySQL');

    await connectRabbit();

    app.listen(PORT, () => {
      console.log(`🚀 Reservation Service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
  }
})();
