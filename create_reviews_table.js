/**
 * Migration: create reviews table
 * Run: node server/create_reviews_table.js
 */
const { sequelize } = require('./server/src/config/database');
require('./server/src/models/index'); // registers all associations

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Sync only the Review model (alter: true is safe for new columns/tables)
    const { Review } = require('./server/src/models');
    await Review.sync({ alter: true });
    console.log('✅ reviews table created/altered');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
