require('dotenv').config();
const { sequelize } = require('./src/config/database');
require('./src/models/index');

async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    const { SeriesNote } = require('./src/models');
    await SeriesNote.sync({ alter: true });
    
    console.log('SeriesNote table altered successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing:', err);
    process.exit(1);
  }
}

syncDB();
