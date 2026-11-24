const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Plan = sequelize.define('Plan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  type: { type: DataTypes.ENUM('institute', 'student'), allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  interval: { type: DataTypes.ENUM('monthly', 'yearly', 'lifetime'), defaultValue: 'monthly' },
  features: { type: DataTypes.JSON, allowNull: true, defaultValue: [] }, // Array of strings
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  razorpayPlanId: { type: DataTypes.STRING, allowNull: true },
  
  // Institute plan limits
  maxStudents: { type: DataTypes.INTEGER, allowNull: true },
  maxBatches: { type: DataTypes.INTEGER, allowNull: true },
  
  // Custom badge/highlight
  highlight: { type: DataTypes.BOOLEAN, defaultValue: false },

  // Trial period
  trialEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  trialDays: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 7 },

  // Modules allowed (for institute plans to restrict access to specific features)
  modules: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
}, {
  tableName: 'plans',
});

module.exports = Plan;
