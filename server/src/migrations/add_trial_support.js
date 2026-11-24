/**
 * Migration: Add trial support to users table
 * 1. Changes studentSubscriptionPlan from ENUM to VARCHAR(100) — supports UUID plan IDs
 * 2. Adds 'trial' to studentSubscriptionStatus ENUM
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mocktest_lms',
  });

  console.log('\n📦 Running trial support migration...\n');

  // 1. Change studentSubscriptionPlan from ENUM → VARCHAR(100) to support UUID plan IDs
  try {
    await conn.query(`
      ALTER TABLE \`users\`
      MODIFY COLUMN \`studentSubscriptionPlan\` VARCHAR(100) NOT NULL DEFAULT 'free'
    `);
    console.log('  ✅ studentSubscriptionPlan: ENUM → VARCHAR(100)');
  } catch (err) {
    console.log('  ⚠️  studentSubscriptionPlan:', err.message.slice(0, 100));
  }

  // 2. Add 'trial' to studentSubscriptionStatus ENUM
  try {
    await conn.query(`
      ALTER TABLE \`users\`
      MODIFY COLUMN \`studentSubscriptionStatus\`
        ENUM('active','trial','expired','cancelled') NOT NULL DEFAULT 'expired'
    `);
    console.log('  ✅ studentSubscriptionStatus: added trial');
  } catch (err) {
    console.log('  ⚠️  studentSubscriptionStatus:', err.message.slice(0, 100));
  }

  await conn.end();
  console.log('\n🎉 Trial migration complete!\n');
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
