/**
 * Migration script to add verification details and document upload fields to olympiad_registrations
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const [existingCols] = await sequelize.query('DESCRIBE olympiad_registrations');
    const existingColNames = existingCols.map(c => c.Field);

    const additions = [
      { name: 'dob', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN dob VARCHAR(30) NULL AFTER classSelected' },
      { name: 'gender', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN gender VARCHAR(20) NULL AFTER dob' },
      { name: 'fatherName', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN fatherName VARCHAR(150) NULL AFTER gender' },
      { name: 'address', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN address TEXT NULL AFTER fatherName' },
      { name: 'board', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN board VARCHAR(100) NULL AFTER address' },
      { name: 'medium', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN medium VARCHAR(50) NULL AFTER board' },
      { name: 'documentType', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN documentType VARCHAR(100) NULL AFTER medium' },
      { name: 'documentUrl', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN documentUrl VARCHAR(500) NULL AFTER documentType' },
      { name: 'verificationStatus', sql: "ALTER TABLE olympiad_registrations ADD COLUMN verificationStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER documentUrl" },
      { name: 'verificationRemarks', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN verificationRemarks TEXT NULL AFTER verificationStatus' },
      { name: 'verifiedAt', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN verifiedAt DATETIME NULL AFTER verificationRemarks' },
      { name: 'verifiedBy', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN verifiedBy CHAR(36) NULL AFTER verifiedAt' },
    ];

    for (const col of additions) {
      if (!existingColNames.includes(col.name)) {
        await sequelize.query(col.sql);
        console.log(`Added column: ${col.name}`);
      } else {
        console.log(`Column ${col.name} already exists`);
      }
    }

    console.log('✅ Olympiad registration verification fields migration finished successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
