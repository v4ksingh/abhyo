const { sequelize } = require('./src/config/database');
const { EmailLog, Waitlist } = require('./src/models');

async function syncSpecificDb() {
  try {
    await EmailLog.sync({ alter: true });
    console.log('EmailLog synced');
    await Waitlist.sync({ alter: true });
    console.log('Waitlist synced');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncSpecificDb();
