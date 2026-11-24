const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Junction table: which tests are assigned to which batches
const BatchTest = sequelize.define('BatchTest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  batchId: { type: DataTypes.UUID, allowNull: false },
  testId: { type: DataTypes.UUID, allowNull: false },
  startTime: { type: DataTypes.DATE, allowNull: true }, // For Live Scheduled Tests
  deadline: { type: DataTypes.DATE, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'batch_tests',
  indexes: [{ unique: true, fields: ['batchId', 'testId'] }],
});

// Junction table: which users are in which batches
const BatchStudent = sequelize.define('BatchStudent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  batchId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'batch_students',
  indexes: [{ unique: true, fields: ['batchId', 'userId'] }],
});

module.exports = { BatchTest, BatchStudent };
