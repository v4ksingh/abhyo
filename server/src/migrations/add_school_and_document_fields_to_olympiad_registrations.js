/**
 * Migration script to add school details and document number fields to olympiad_registrations
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
      { name: 'schoolType', sql: "ALTER TABLE olympiad_registrations ADD COLUMN schoolType VARCHAR(20) DEFAULT 'private' AFTER medium" },
      { name: 'schoolName', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN schoolName VARCHAR(255) NULL AFTER schoolType' },
      { name: 'schoolAddress', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN schoolAddress TEXT NULL AFTER schoolName' },
      { name: 'documentNumber', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN documentNumber VARCHAR(100) NULL AFTER documentType' },
      { name: 'schoolIdCardUrl', sql: 'ALTER TABLE olympiad_registrations ADD COLUMN schoolIdCardUrl VARCHAR(500) NULL AFTER documentUrl' },
    ];

    for (const col of additions) {
      if (!existingColNames.includes(col.name)) {
        await sequelize.query(col.sql);
        console.log(`Added column: ${col.name}`);
      } else {
        console.log(`Column ${col.name} already exists`);
      }
    }

    console.log('✅ Olympiad registration school and document fields migration finished successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
