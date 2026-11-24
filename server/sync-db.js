const { connectDB } = require('./src/config/database');
const { sequelize } = require('./src/config/database');
require('./src/models/index');

const syncDb = async () => {
  await connectDB();
  console.log('Syncing database...');
  await sequelize.sync({ alter: true });
  console.log('Database sync complete');
  process.exit();
};

syncDb();
