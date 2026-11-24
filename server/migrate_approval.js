const { sequelize } = require('./src/config/database');

async function migrate() {
  try {
    console.log('Running manual migration...');
    
    // Add instituteApprovalStatus to users table
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS instituteApprovalStatus ENUM('none', 'pending', 'approved', 'rejected') 
      DEFAULT 'none' 
      AFTER instituteId;
    `);
    
    console.log('✅ Migration successful: instituteApprovalStatus added.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
