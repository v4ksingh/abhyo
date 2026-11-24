/**
 * One-off migration: add `subCategory` column to `tests` table
 * Run with: node server/add_subcategory.js
 */
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Check if column already exists first
    const [results] = await sequelize.query(`SHOW COLUMNS FROM tests LIKE 'subCategory'`);
    if (results.length > 0) {
      console.log('ℹ️  Column `subCategory` already exists. Nothing to do.');
      process.exit(0);
    }

    await sequelize.query(`
      ALTER TABLE tests
      ADD COLUMN subCategory VARCHAR(255) NULL DEFAULT NULL
      AFTER category
    `);
    console.log('✅ Column `subCategory` added to `tests` table successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
