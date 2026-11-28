const { sequelize } = require('./server/src/config/database');

async function migrate() {
  try {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM `exam_series` LIKE 'linkedExams'");
    if (cols.length === 0) {
      await sequelize.query("ALTER TABLE `exam_series` ADD COLUMN `linkedExams` JSON NULL");
      console.log('✅ Added linkedExams column to exam_series');
    } else {
      console.log('ℹ️ linkedExams column already exists in exam_series');
    }

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
