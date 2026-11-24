const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(300), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: {
    type: DataTypes.ENUM('test_assigned', 'test_reminder', 'result_published', 'institute_approved', 'payment_success', 'general'),
    defaultValue: 'general',
  },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  data: { type: DataTypes.JSON, defaultValue: {} },
  // FK
  userId: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['userId'] },
    { fields: ['isRead'] },
  ],
});

module.exports = Notification;
