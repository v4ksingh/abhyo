/**
 * Safe migration: Add student subscription fields to users table
 * Uses individual ADD COLUMN with error handling for older MySQL
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

async function addColumnIfMissing(conn, table, column, definition) {
  try {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`  ✅ Added: ${column}`);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log(`  ⚠️  ${column} already exists — skipping`);
    } else {
      throw err;
    }
  }
}

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mocktest_lms',
  });

  console.log('\n📦 Running student subscription migration...\n');

  // 1. Add subscription columns to users
  console.log('→ Updating users table...');
  await addColumnIfMissing(conn, 'users', 'studentSubscriptionPlan',
    "ENUM('free','pro_monthly','pro_yearly') NOT NULL DEFAULT 'free'");
  await addColumnIfMissing(conn, 'users', 'studentSubscriptionStatus',
    "ENUM('active','expired','cancelled') NOT NULL DEFAULT 'expired'");
  await addColumnIfMissing(conn, 'users', 'studentSubscriptionEndDate',
    "DATETIME NULL");

  // 2. Expand payment type enum to include student_subscription
  console.log('\n→ Updating payments table...');
  try {
    await conn.query(`
      ALTER TABLE \`payments\`
      MODIFY COLUMN \`type\`
        ENUM('test_purchase','institute_subscription','one_time','student_subscription')
        NOT NULL DEFAULT 'one_time'
    `);
    console.log('  ✅ payments.type enum updated');
  } catch (err) {
    console.log('  ⚠️  payments.type:', err.message.slice(0, 80));
  }

  await conn.end();
  console.log('\n🎉 Migration complete!\n');
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
