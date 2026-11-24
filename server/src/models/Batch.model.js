const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Batch = sequelize.define('Batch', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  // FK set in index.js
  instituteId: { type: DataTypes.UUID, allowNull: false },
  courseId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'batches',
});

module.exports = Batch;
