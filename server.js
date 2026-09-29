require('dotenv').config();
const app = require('./src/app');
const pool = require('./src/db/pool');

const PORT = process.env.PORT || 3000;

// Test DB connection before listening
(async () => {
  try {
    const [rows] = await pool.execute('SELECT 1 AS ok');
    console.log('✅ MySQL connection verified via pool.');

    app.listen(PORT, () => {
      console.log(`🚀 Food Backend server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MySQL database:', err.message);
    process.exit(1);
  }
})();
