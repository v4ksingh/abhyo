const { sequelize } = require('./server/src/config/database');

async function migrate() {
  try {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM `government_jobs` LIKE 'jobLevel'");
    if (cols.length === 0) {
      await sequelize.query("ALTER TABLE `government_jobs` ADD COLUMN `jobLevel` VARCHAR(50) NOT NULL DEFAULT 'Central'");
      console.log('✅ Added jobLevel column');
    } else {
      console.log('ℹ️ jobLevel column already exists');
    }

    const [cols2] = await sequelize.query("SHOW COLUMNS FROM `government_jobs` LIKE 'state'");
    if (cols2.length === 0) {
      await sequelize.query("ALTER TABLE `government_jobs` ADD COLUMN `state` VARCHAR(100) NULL");
      console.log('✅ Added state column');
    } else {
      console.log('ℹ️ state column already exists');
    }

    // Auto-tag state jobs
    await sequelize.query("UPDATE `government_jobs` SET `jobLevel` = 'State', `state` = 'Bihar' WHERE `category` = 'State PSC' AND (`title` LIKE '%Bihar%' OR `organization` LIKE '%Bihar%' OR `title` LIKE '%BPSC%')");
    await sequelize.query("UPDATE `government_jobs` SET `jobLevel` = 'State' WHERE `category` = 'State PSC' AND `jobLevel` = 'Central'");

    console.log('🎉 Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
