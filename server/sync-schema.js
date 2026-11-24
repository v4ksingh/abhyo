require('dotenv').config();
const { sequelize } = require('./src/config/database');
require('./src/models/index');

async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    // We only want to sync the new model
    const { EnrollmentRequest } = require('./src/models');
    await EnrollmentRequest.sync({ alter: true });
    
    console.log('EnrollmentRequest table created/synced successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing:', err);
    process.exit(1);
  }
}

syncDB();
