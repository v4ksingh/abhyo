/**
 * Sync eBooks table to MySQL
 * Run: node sync-ebooks.js
 */
require('dotenv').config();
const { sequelize } = require('./src/config/database');
const EBook = require('./src/models/EBook.model');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');
    await EBook.sync({ alter: true });
    console.log('✅ ebooks table synced');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
  }
})();
