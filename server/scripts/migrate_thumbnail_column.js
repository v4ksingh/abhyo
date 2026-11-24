/**
 * Production Migration Script: Adds `thumbnailImage` to `government_jobs` table
 * Run on server: node scripts/migrate_thumbnail_column.js
 */
require('dotenv').config();
const { sequelize } = require('../src/config/database');

async function migrate() {
  try {
    console.log('Connecting to database...');
    const [cols] = await sequelize.query('DESCRIBE government_jobs');
    const hasCol = cols.some((c) => c.Field === 'thumbnailImage');

    if (!hasCol) {
      console.log('Adding thumbnailImage column to government_jobs...');
      await sequelize.query(
        'ALTER TABLE government_jobs ADD COLUMN thumbnailImage VARCHAR(500) NULL AFTER adminNotes'
      );
      console.log('✅ thumbnailImage column added successfully!');
    } else {
      console.log('ℹ️ thumbnailImage column already exists. No change needed.');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();

