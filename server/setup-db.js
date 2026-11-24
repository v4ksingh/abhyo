const { sequelize } = require('./src/config/database');
const { FeeStructure, StudentFee, Expense, Payment } = require('./src/models/index');

const setup = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // Sync only new tables
    await FeeStructure.sync({ force: false });
    await StudentFee.sync({ force: false });
    await Expense.sync({ force: false });
    console.log('New tables synced.');

    // Alter Payment table
    await sequelize.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS paymentMode ENUM('online', 'cash', 'upi', 'bank') DEFAULT 'online',
      ADD COLUMN IF NOT EXISTS transactionId VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS date DATE DEFAULT (CURRENT_DATE);
    `);
    
    // Modify existing ENUM for type and status if needed
    // (MySQL ENUM alteration can be tricky; best to use modify column)
    await sequelize.query(`
      ALTER TABLE payments MODIFY COLUMN status ENUM('pending', 'captured', 'failed', 'refunded', 'success') DEFAULT 'pending';
    `);
    await sequelize.query(`
      ALTER TABLE payments MODIFY COLUMN type ENUM('test_purchase', 'institute_subscription', 'one_time', 'fee_payment') DEFAULT 'one_time';
    `);
    
    console.log('Payments table altered.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setup();
