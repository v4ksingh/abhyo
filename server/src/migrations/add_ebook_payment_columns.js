/**
 * Migration: Add ebookId and couponCode columns to payments table
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

async function addColumnIfMissing(conn, table, column, definition) {
  try {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`  ✅ Added: ${column} to ${table}`);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column name')) {
      console.log(`  ⚠️  ${column} already exists — skipping`);
    } else {
      console.error(`  ❌ Error adding ${column}:`, err.message);
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

  console.log('\n📦 Running ebook payment columns migration...\n');

  // 1. Add ebookId column to payments table
  await addColumnIfMissing(conn, 'payments', 'ebookId', 'CHAR(36) NULL');

  // 2. Add couponCode column to payments table (in case it is missing)
  await addColumnIfMissing(conn, 'payments', 'couponCode', 'VARCHAR(50) NULL');

  // 3. Add index on ebookId
  try {
    await conn.query(`ALTER TABLE \`payments\` ADD INDEX \`payments_ebookId_idx\` (\`ebookId\`)`);
    console.log('  ✅ Added index on payments(ebookId)');
  } catch (err) {
    if (err.code === 'ER_DUP_KEYNAME' || err.message.includes('Duplicate key name')) {
      console.log('  ⚠️  Index payments_ebookId_idx already exists');
    } else {
      console.log('  ℹ️  Index creation note:', err.message);
    }
  }

  // Check columns on payments
  const [columns] = await conn.query(`SHOW COLUMNS FROM \`payments\``);
  console.log('\n📋 Current columns on payments table:');
  console.log(columns.map(c => c.Field).join(', '));

  await conn.end();
  console.log('\n🎉 EBook payment migration complete!\n');
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
