require('dotenv').config();
const { sequelize } = require('./src/config/database');
require('./src/models/index');

async function syncCourse() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    // We want to sync the Course model with new fields
    const { Course } = require('./src/models');
    await Course.sync({ alter: true });
    
    console.log('Course table altered/synced successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing:', err);
    process.exit(1);
  }
}

syncCourse();
