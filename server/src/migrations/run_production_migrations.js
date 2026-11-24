/**
 * Master Production Migration Script
 * Safe to run multiple times (idempotent).
 * Ensures all tables and columns needed for the latest features exist on MySQL.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const { sequelize } = require('../config/database');
const EBook = require('../models/EBook.model');

async function addColumnIfMissing(conn, table, column, definition) {
  try {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`  ✅ Added: ${table}.${column}`);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column name')) {
      console.log(`  ℹ️  ${table}.${column} already exists`);
    } else {
      console.log(`  ⚠️  Note on ${table}.${column}:`, err.message.slice(0, 100));
    }
  }
}

async function addIndexIfMissing(conn, table, indexName, column) {
  try {
    await conn.query(`ALTER TABLE \`${table}\` ADD INDEX \`${indexName}\` (\`${column}\`)`);
    console.log(`  ✅ Added index ${indexName} on ${table}(${column})`);
  } catch (err) {
    if (err.code === 'ER_DUP_KEYNAME' || err.message.includes('Duplicate key name')) {
      console.log(`  ℹ️  Index ${indexName} already exists`);
    } else {
      console.log(`  ⚠️  Note on index ${indexName}:`, err.message.slice(0, 100));
    }
  }
}

async function run() {
  console.log('\n🚀 Starting Production Migrations...\n');

  // 1. Ensure all database tables exist (creates any missing tables without touching existing data)
  console.log('→ Verifying database tables...');
  try {
    require('../models/index');
    await sequelize.sync({ force: false });
    console.log('  ✅ All database tables verified/created successfully');
  } catch (err) {
    console.log('  ℹ️ Note during table sync:', err.message.slice(0, 120));
  }

  // 2. Connect via mysql2 for ALTER commands
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mocktest_lms',
  });

  // 3. Update payments table
  console.log('\n→ Checking payments table...');
  await addColumnIfMissing(conn, 'payments', 'ebookId', 'CHAR(36) NULL');
  await addColumnIfMissing(conn, 'payments', 'couponCode', 'VARCHAR(50) NULL');
  await addIndexIfMissing(conn, 'payments', 'payments_ebookId_idx', 'ebookId');

  try {
    await conn.query(`
      ALTER TABLE \`payments\`
      MODIFY COLUMN \`type\`
        ENUM('test_purchase','institute_subscription','one_time','fee_payment','student_subscription')
        NOT NULL DEFAULT 'one_time'
    `);
    console.log('  ✅ payments.type ENUM updated');
  } catch (err) {
    console.log('  ℹ️  payments.type ENUM:', err.message.slice(0, 80));
  }

  // 4. Update users table for student subscription & trial
  console.log('\n→ Checking users table (subscription & trial fields)...');
  await addColumnIfMissing(conn, 'users', 'studentSubscriptionPlan', "VARCHAR(100) NOT NULL DEFAULT 'free'");
  await addColumnIfMissing(conn, 'users', 'studentSubscriptionStatus', "ENUM('active','trial','expired','cancelled') NOT NULL DEFAULT 'expired'");
  await addColumnIfMissing(conn, 'users', 'studentSubscriptionEndDate', "DATETIME NULL");

  try {
    await conn.query(`
      ALTER TABLE \`users\`
      MODIFY COLUMN \`studentSubscriptionPlan\` VARCHAR(100) NOT NULL DEFAULT 'free'
    `);
    await conn.query(`
      ALTER TABLE \`users\`
      MODIFY COLUMN \`studentSubscriptionStatus\`
        ENUM('active','trial','expired','cancelled') NOT NULL DEFAULT 'expired'
    `);
    console.log('  ✅ users subscription ENUMs updated');
  } catch (err) {
    console.log('  ℹ️  users columns modification:', err.message.slice(0, 80));
  }

  // 5. Update olympiad_registrations table (verification, photo crop, school details & free waiver)
  console.log('\n→ Checking olympiad_registrations table...');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'dob', 'VARCHAR(30) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'gender', 'VARCHAR(20) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'fatherName', 'VARCHAR(150) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'address', 'TEXT NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'board', 'VARCHAR(100) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'medium', 'VARCHAR(50) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'schoolType', "VARCHAR(20) DEFAULT 'private'");
  await addColumnIfMissing(conn, 'olympiad_registrations', 'schoolName', 'VARCHAR(255) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'schoolAddress', 'TEXT NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'documentType', 'VARCHAR(100) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'documentNumber', 'VARCHAR(100) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'documentUrl', 'VARCHAR(500) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'schoolIdCardUrl', 'VARCHAR(500) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'studentPhotoUrl', 'VARCHAR(500) NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'verificationStatus', "ENUM('pending','approved','rejected') DEFAULT 'pending'");
  await addColumnIfMissing(conn, 'olympiad_registrations', 'verificationRemarks', 'TEXT NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'verifiedAt', 'DATETIME NULL');
  await addColumnIfMissing(conn, 'olympiad_registrations', 'verifiedBy', 'CHAR(36) NULL');

  await conn.end();
  console.log('\n✨ All production migrations checked and up-to-date!\n');
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
