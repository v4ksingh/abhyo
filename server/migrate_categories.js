const { sequelize } = require('./src/config/database');

async function run() {
  try {
     await sequelize.query('ALTER TABLE categories ADD COLUMN parentId char(36) NULL;');
     console.log('Added parentId column to categories');
  } catch(e) {
     console.error(e);
  }
  process.exit();
}
run();
